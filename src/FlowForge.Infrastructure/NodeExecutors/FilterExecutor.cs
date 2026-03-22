using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using Newtonsoft.Json.Linq;

namespace FlowForge.Infrastructure.NodeExecutors;

public class FilterExecutor : INodeExecutor
{
    private readonly IExpressionEvaluator _evaluator;
    public FilterExecutor(IExpressionEvaluator evaluator) => _evaluator = evaluator;
    public NodeType NodeType => NodeType.Filter;

    public Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        var conditions = context.GetConfig<List<JObject>>("conditions") ?? new();
        var combineWith = context.GetConfigString("combineWith", "AND");

        var filtered = context.InputItems.Where(item =>
        {
            var results = conditions.Select(cond => EvaluateCondition(cond, item, context)).ToList();
            return combineWith == "OR" ? results.Any(r => r) : results.All(r => r);
        }).ToList();

        return Task.FromResult(new NodeExecutionResult { Success = true, Items = filtered });
    }

    private bool EvaluateCondition(JObject condition, JObject item, WorkflowNodeContext context)
    {
        var field = condition["field"]?.ToString();
        var op = condition["operator"]?.ToString() ?? "equals";
        var value = condition["value"]?.ToString();

        if (string.IsNullOrEmpty(field)) return true;

        var fieldValue = _evaluator.Evaluate($"{{{{$json.{field}}}}}", item, context.ExecutionContext);

        return op switch
        {
            "equals" => fieldValue == value,
            "notEquals" => fieldValue != value,
            "contains" => fieldValue?.Contains(value ?? "") ?? false,
            "notContains" => !(fieldValue?.Contains(value ?? "") ?? false),
            "startsWith" => fieldValue?.StartsWith(value ?? "") ?? false,
            "endsWith" => fieldValue?.EndsWith(value ?? "") ?? false,
            "isEmpty" => string.IsNullOrEmpty(fieldValue),
            "isNotEmpty" => !string.IsNullOrEmpty(fieldValue),
            "greaterThan" => double.TryParse(fieldValue, out var fv) && double.TryParse(value, out var v) && fv > v,
            "lessThan" => double.TryParse(fieldValue, out var fv2) && double.TryParse(value, out var v2) && fv2 < v2,
            _ => true
        };
    }
}
