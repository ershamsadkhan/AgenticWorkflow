using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;

namespace FlowForge.Infrastructure.NodeExecutors;

public class DelayExecutor : INodeExecutor
{
    public NodeType NodeType => NodeType.Delay;

    public async Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        var delayMs = context.GetConfig<int>("delayMs", 1000);
        var maxDelay = Math.Min(delayMs, 30_000); // Cap at 30 seconds for safety
        await Task.Delay(maxDelay, context.ExecutionContext.CancellationToken);
        return new NodeExecutionResult { Success = true, Items = context.InputItems };
    }
}
