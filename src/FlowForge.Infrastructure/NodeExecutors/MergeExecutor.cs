using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using Newtonsoft.Json.Linq;

namespace FlowForge.Infrastructure.NodeExecutors;

public class MergeExecutor : INodeExecutor
{
    public NodeType NodeType => NodeType.Merge;

    public Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        // Collect all outputs from connected input nodes from the execution context
        var allItems = new List<JObject>();
        foreach (var nodeOutput in context.ExecutionContext.NodeOutputs.Values)
            allItems.AddRange(nodeOutput);

        // Also include current input
        foreach (var item in context.InputItems)
            if (!allItems.Any(a => a.ToString() == item.ToString()))
                allItems.Add(item);

        return Task.FromResult(new NodeExecutionResult { Success = true, Items = allItems });
    }
}
