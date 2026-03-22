using FlowForge.Core.Entities;
using Newtonsoft.Json.Linq;

namespace FlowForge.Core.Interfaces;

public class ExecutionContext
{
    public Guid WorkflowId { get; set; }
    public Guid ExecutionId { get; set; }
    public List<JObject> TriggerData { get; set; } = new();
    public Dictionary<string, object?> Variables { get; set; } = new();
    public Dictionary<Guid, List<JObject>> NodeOutputs { get; set; } = new();
    public Dictionary<Guid, Dictionary<string, List<JObject>>> ConditionalOutputs { get; set; } = new();
    public Dictionary<Guid, Dictionary<string, string>> Credentials { get; set; } = new();
    public string Mode { get; set; } = "manual";
    public CancellationToken CancellationToken { get; set; }
}

public class NodeExecutionResult
{
    public bool Success { get; set; }
    public List<JObject> Items { get; set; } = new();
    public string? ErrorMessage { get; set; }
    public Dictionary<string, List<JObject>>? ConditionalOutputs { get; set; }
}

public interface IExecutionEngine
{
    Task<WorkflowExecution> ExecuteAsync(Guid workflowId, string mode = "manual",
        List<JObject>? triggerData = null, CancellationToken cancellationToken = default);
    Task<WorkflowExecution> ExecuteByWebhookAsync(string webhookPath, JObject requestData);
}
