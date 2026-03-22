using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using Newtonsoft.Json.Linq;

namespace FlowForge.Infrastructure.NodeExecutors;

public class LoopExecutor : INodeExecutor
{
    public NodeType NodeType => NodeType.Loop;

    public Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        // Flatten all items (loop passes them one by one downstream)
        // In BFS execution model, we just pass all items through
        return Task.FromResult(new NodeExecutionResult { Success = true, Items = context.InputItems });
    }
}
