using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using Newtonsoft.Json.Linq;

namespace FlowForge.Infrastructure.NodeExecutors;

public class IfConditionExecutor : INodeExecutor
{
    private readonly IExpressionEvaluator _evaluator;
    public IfConditionExecutor(IExpressionEvaluator evaluator) => _evaluator = evaluator;
    public NodeType NodeType => NodeType.Condition;

    public Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        var trueItems = new List<JObject>();
        var falseItems = new List<JObject>();
        var conditions = context.GetConfig<List<JObject>>("conditions") ?? new();
        var combineWith = context.GetConfigString("combineWith", "AND");

        foreach (var item in context.InputItems)
        {
            var results = conditions.Select(cond => EvaluateCondition(cond, item, context)).ToList();
            var passes = combineWith == "OR" ? results.Any(r => r) : results.All(r => r);
            (passes ? trueItems : falseItems).Add(item);
        }

        return Task.FromResult(new NodeExecutionResult
        {
            Success = true,
            Items = trueItems,
            ConditionalOutputs = new Dictionary<string, List<JObject>>
            {
                ["true"] = trueItems,
                ["false"] = falseItems,
                ["output"] = trueItems
            }
        });
    }

    private bool EvaluateCondition(JObject condition, JObject item, WorkflowNodeContext context)
    {
        var field = condition["field"]?.ToString() ?? "";
        var op = condition["operator"]?.ToString() ?? "equals";
        var value = condition["value"]?.ToString() ?? "";
        var fieldValue = _evaluator.Evaluate(
            field.StartsWith("{{") ? field : $"{{{{$json.{field}}}}}",
            item, context.ExecutionContext);

        return op switch
        {
            "equals" => fieldValue == value,
            "notEquals" => fieldValue != value,
            "contains" => fieldValue?.Contains(value) ?? false,
            "greaterThan" => double.TryParse(fieldValue, out var fv) && double.TryParse(value, out var v) && fv > v,
            "lessThan" => double.TryParse(fieldValue, out var fv2) && double.TryParse(value, out var v2) && fv2 < v2,
            "isEmpty" => string.IsNullOrEmpty(fieldValue),
            "isNotEmpty" => !string.IsNullOrEmpty(fieldValue),
            "isTrue" => fieldValue?.ToLower() is "true" or "1" or "yes",
            "isFalse" => fieldValue?.ToLower() is "false" or "0" or "no",
            _ => false
        };
    }
}
