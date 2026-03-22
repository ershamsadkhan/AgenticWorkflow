using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;

namespace FlowForge.Infrastructure.NodeExecutors;

public class WebhookTriggerExecutor : INodeExecutor
{
    public NodeType NodeType => NodeType.Webhook;

    public Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        // Input items come from webhook request data
        var items = context.InputItems.Count > 0 ? context.InputItems
            : new List<Newtonsoft.Json.Linq.JObject>();
        return Task.FromResult(new NodeExecutionResult { Success = true, Items = items });
    }
}
