using FlowForge.Core.Entities;
using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using FlowForge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using WorkflowCtx = FlowForge.Core.Interfaces.ExecutionContext;

namespace FlowForge.Infrastructure.Services;

public class ExecutionEngine : IExecutionEngine
{
    private readonly IServiceProvider _serviceProvider;
    private readonly AppDbContext _db;
    private readonly ILogger<ExecutionEngine> _logger;
    private readonly ICredentialService _credentialService;
    private readonly IVariableRepository _variableRepo;

    public ExecutionEngine(
        IServiceProvider serviceProvider,
        AppDbContext db,
        ILogger<ExecutionEngine> logger,
        ICredentialService credentialService,
        IVariableRepository variableRepo)
    {
        _serviceProvider = serviceProvider;
        _db = db;
        _logger = logger;
        _credentialService = credentialService;
        _variableRepo = variableRepo;
    }

    public async Task<WorkflowExecution> ExecuteAsync(Guid workflowId, string mode = "manual",
        List<JObject>? triggerData = null, CancellationToken cancellationToken = default)
    {
        var workflow = await _db.Workflows
            .Include(w => w.Nodes).ThenInclude(n => n.Credential)
            .Include(w => w.Connections)
            .FirstOrDefaultAsync(w => w.Id == workflowId, cancellationToken);

        if (workflow == null)
            throw new InvalidOperationException($"Workflow {workflowId} not found");

        var execution = new WorkflowExecution
        {
            WorkflowId = workflowId,
            Status = ExecutionStatus.Running,
            Mode = mode,
            TriggerData = triggerData != null ? JsonConvert.SerializeObject(triggerData) : null
        };

        _db.WorkflowExecutions.Add(execution);
        await _db.SaveChangesAsync(cancellationToken);

        var executionCtx = new WorkflowCtx
        {
            WorkflowId = workflowId,
            ExecutionId = execution.Id,
            TriggerData = triggerData ?? new List<JObject> { new() },
            Mode = mode,
            CancellationToken = cancellationToken
        };

        // Load variables
        var vars = await _variableRepo.GetWorkflowVariablesAsync(workflow.UserId, workflowId);
        foreach (var kv in vars) executionCtx.Variables[kv.Key] = kv.Value;

        // Load credentials
        foreach (var node in workflow.Nodes.Where(n => n.Credential != null))
        {
            executionCtx.Credentials[node.CredentialId!.Value] =
                _credentialService.DecryptCredential(node.Credential!.EncryptedData);
        }

        try
        {
            await RunWorkflowGraphAsync(workflow, execution, executionCtx);
            execution.Status = ExecutionStatus.Success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Workflow {WorkflowId} execution failed", workflowId);
            execution.Status = ExecutionStatus.Failed;
            execution.ErrorMessage = ex.Message;
        }
        finally
        {
            execution.FinishedAt = DateTime.UtcNow;
            execution.DurationMs = (long)(execution.FinishedAt.Value - execution.StartedAt).TotalMilliseconds;
            _db.WorkflowExecutions.Update(execution);
            await _db.SaveChangesAsync(CancellationToken.None);
        }

        return execution;
    }

    public async Task<WorkflowExecution> ExecuteByWebhookAsync(string webhookPath, JObject requestData)
    {
        var workflow = await _db.Workflows
            .FirstOrDefaultAsync(w => w.WebhookPath == webhookPath && w.Status == WorkflowStatus.Active);

        if (workflow == null)
            throw new InvalidOperationException($"No active workflow found for webhook path: {webhookPath}");

        return await ExecuteAsync(workflow.Id, "webhook", new List<JObject> { requestData });
    }

    private async Task RunWorkflowGraphAsync(Workflow workflow, WorkflowExecution execution, WorkflowCtx ctx)
    {
        var nodes = workflow.Nodes.Where(n => !n.IsDisabled).ToList();
        var connections = workflow.Connections.ToList();

        // Find trigger nodes (no incoming connections)
        var targetNodeIds = connections.Select(c => c.TargetNodeId).ToHashSet();
        var triggerNodes = nodes.Where(n => !targetNodeIds.Contains(n.Id)).ToList();

        if (!triggerNodes.Any())
            triggerNodes = nodes.OrderBy(n => n.ExecutionOrder).Take(1).ToList();

        // Process queue: (nodeId, inputItems)
        var queue = new Queue<(WorkflowNode node, List<JObject> items)>();
        var executed = new HashSet<Guid>();

        foreach (var trigger in triggerNodes)
            queue.Enqueue((trigger, ctx.TriggerData));

        var executors = _serviceProvider.GetServices<INodeExecutor>()
            .ToDictionary(e => e.NodeType);

        while (queue.Count > 0 && !ctx.CancellationToken.IsCancellationRequested)
        {
            var (node, inputItems) = queue.Dequeue();

            if (executed.Contains(node.Id)) continue;
            executed.Add(node.Id);

            var nodeExecution = new NodeExecution
            {
                WorkflowExecutionId = execution.Id,
                NodeId = node.Id,
                Status = ExecutionStatus.Running,
                InputData = JsonConvert.SerializeObject(inputItems)
            };
            _db.NodeExecutions.Add(nodeExecution);
            await _db.SaveChangesAsync(ctx.CancellationToken);

            NodeExecutionResult result;
            try
            {
                if (!executors.TryGetValue(node.Type, out var executor))
                {
                    // No executor — pass data through
                    result = new NodeExecutionResult { Success = true, Items = inputItems };
                }
                else
                {
                    var nodeCtx = new WorkflowNodeContext
                    {
                        NodeId = node.Id,
                        NodeName = node.Name,
                        Configuration = node.Configuration,
                        CredentialId = node.CredentialId,
                        InputItems = inputItems,
                        ExecutionContext = ctx
                    };
                    result = await executor.ExecuteAsync(nodeCtx);
                }

                nodeExecution.Status = result.Success ? ExecutionStatus.Success : ExecutionStatus.Failed;
                nodeExecution.OutputData = JsonConvert.SerializeObject(result.Items);
                nodeExecution.ErrorMessage = result.ErrorMessage;

                if (result.Success)
                {
                    ctx.NodeOutputs[node.Id] = result.Items;

                    // Queue downstream nodes
                    var outConns = connections.Where(c => c.SourceNodeId == node.Id).ToList();

                    // Handle conditional outputs
                    if (result.ConditionalOutputs != null)
                    {
                        foreach (var condConn in outConns)
                        {
                            var handle = condConn.SourceHandle;
                            if (result.ConditionalOutputs.TryGetValue(handle, out var condItems))
                            {
                                var targetNode = nodes.FirstOrDefault(n => n.Id == condConn.TargetNodeId);
                                if (targetNode != null && !executed.Contains(targetNode.Id))
                                    queue.Enqueue((targetNode, condItems));
                            }
                        }
                    }
                    else
                    {
                        foreach (var conn in outConns)
                        {
                            var targetNode = nodes.FirstOrDefault(n => n.Id == conn.TargetNodeId);
                            if (targetNode != null && !executed.Contains(targetNode.Id))
                                queue.Enqueue((targetNode, result.Items));
                        }
                    }
                }
                else if (!string.IsNullOrEmpty(result.ErrorMessage))
                {
                    throw new Exception($"Node '{node.Name}' failed: {result.ErrorMessage}");
                }
            }
            catch (Exception ex)
            {
                nodeExecution.Status = ExecutionStatus.Failed;
                nodeExecution.ErrorMessage = ex.Message;
                throw;
            }
            finally
            {
                nodeExecution.FinishedAt = DateTime.UtcNow;
                nodeExecution.DurationMs = (long)(nodeExecution.FinishedAt.Value - nodeExecution.StartedAt).TotalMilliseconds;
                _db.NodeExecutions.Update(nodeExecution);
                await _db.SaveChangesAsync(CancellationToken.None);
            }
        }
    }
}
