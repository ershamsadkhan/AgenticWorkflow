using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using Newtonsoft.Json.Linq;

namespace FlowForge.Infrastructure.NodeExecutors;

public class TransformExecutor : INodeExecutor
{
    private readonly IExpressionEvaluator _evaluator;
    public TransformExecutor(IExpressionEvaluator evaluator) => _evaluator = evaluator;
    public NodeType NodeType => NodeType.Transform;

    public Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        var mappings = context.GetConfig<List<JObject>>("mappings") ?? new();
        var results = new List<JObject>();

        foreach (var item in context.InputItems)
        {
            var output = new JObject();
            foreach (var mapping in mappings)
            {
                var targetKey = mapping["target"]?.ToString();
                var sourceExpr = mapping["source"]?.ToString();
                if (!string.IsNullOrEmpty(targetKey) && sourceExpr != null)
                {
                    var evaluated = _evaluator.Evaluate(sourceExpr, item, context.ExecutionContext);
                    output[targetKey] = evaluated;
                }
            }
            if (mappings.Count == 0) output = (JObject)item.DeepClone();
            results.Add(output);
        }

        return Task.FromResult(new NodeExecutionResult { Success = true, Items = results });
    }
}
