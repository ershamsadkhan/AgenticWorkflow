using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;

namespace FlowForge.Infrastructure.NodeExecutors;

public class SubWorkflowExecutor : INodeExecutor
{
    private readonly IExecutionEngine _engine;
    public SubWorkflowExecutor(IExecutionEngine engine) => _engine = engine;
    public NodeType NodeType => NodeType.SubWorkflow;

    public async Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        var subWorkflowIdStr = context.GetConfigString("workflowId");
        if (!Guid.TryParse(subWorkflowIdStr, out var subWorkflowId))
            return new NodeExecutionResult { Success = false, ErrorMessage = "Invalid sub-workflow ID" };

        var execution = await _engine.ExecuteAsync(subWorkflowId, "subworkflow", context.InputItems);
        if (execution.Status == Core.Enums.ExecutionStatus.Failed)
            return new NodeExecutionResult { Success = false, ErrorMessage = execution.ErrorMessage };

        return new NodeExecutionResult { Success = true, Items = context.InputItems };
    }
}
