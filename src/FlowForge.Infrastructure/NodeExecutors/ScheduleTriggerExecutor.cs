using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using Newtonsoft.Json.Linq;

namespace FlowForge.Infrastructure.NodeExecutors;

public class ScheduleTriggerExecutor : INodeExecutor
{
    public NodeType NodeType => NodeType.Schedule;

    public Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        var item = new JObject
        {
            ["timestamp"] = DateTime.UtcNow.ToString("O"),
            ["date"] = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            ["time"] = DateTime.UtcNow.ToString("HH:mm:ss")
        };
        return Task.FromResult(new NodeExecutionResult { Success = true, Items = new() { item } });
    }
}
