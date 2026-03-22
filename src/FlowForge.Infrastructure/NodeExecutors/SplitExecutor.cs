using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using Newtonsoft.Json.Linq;

namespace FlowForge.Infrastructure.NodeExecutors;

public class SplitExecutor : INodeExecutor
{
    public NodeType NodeType => NodeType.Split;

    public Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        var batchSize = context.GetConfig<int>("batchSize", 1);
        if (batchSize <= 0) batchSize = 1;

        var chunks = context.InputItems
            .Select((item, idx) => new { item, idx })
            .GroupBy(x => x.idx / batchSize)
            .Select(g => g.Select(x => x.item).ToList())
            .ToList();

        // Return first batch, emit others to "batch1", "batch2" etc.
        var conditionals = new Dictionary<string, List<JObject>>();
        for (int i = 0; i < chunks.Count; i++)
            conditionals[$"batch{i}"] = chunks[i];

        return Task.FromResult(new NodeExecutionResult
        {
            Success = true,
            Items = chunks.FirstOrDefault() ?? new(),
            ConditionalOutputs = conditionals
        });
    }
}
