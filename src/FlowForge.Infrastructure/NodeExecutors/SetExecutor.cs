using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using Newtonsoft.Json.Linq;

namespace FlowForge.Infrastructure.NodeExecutors;

public class SetExecutor : INodeExecutor
{
    private readonly IExpressionEvaluator _evaluator;
    public SetExecutor(IExpressionEvaluator evaluator) => _evaluator = evaluator;
    public NodeType NodeType => NodeType.Set;

    public Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        var results = new List<JObject>();
        var assignments = context.GetConfig<List<JObject>>("assignments") ?? new();
        var keepOriginal = context.GetConfig<bool>("keepOriginal", true);

        foreach (var item in context.InputItems)
        {
            var output = keepOriginal ? (JObject)item.DeepClone() : new JObject();
            foreach (var assign in assignments)
            {
                var key = assign["key"]?.ToString();
                var value = assign["value"]?.ToString();
                if (!string.IsNullOrEmpty(key) && value != null)
                    output[key] = _evaluator.Evaluate(value, item, context.ExecutionContext);
            }
            results.Add(output);
        }

        return Task.FromResult(new NodeExecutionResult { Success = true, Items = results });
    }
}
