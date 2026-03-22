using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using Newtonsoft.Json.Linq;

namespace FlowForge.Infrastructure.NodeExecutors;

public class ManualTriggerExecutor : INodeExecutor
{
    public NodeType NodeType => NodeType.Trigger;

    public Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        var items = context.InputItems.Count > 0
            ? context.InputItems
            : new List<JObject> { new JObject { ["triggered"] = true, ["timestamp"] = DateTime.UtcNow.ToString("O") } };

        return Task.FromResult(new NodeExecutionResult { Success = true, Items = items });
    }
}
