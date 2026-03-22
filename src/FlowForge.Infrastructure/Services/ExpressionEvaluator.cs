using System.Text.RegularExpressions;
using FlowForge.Core.Interfaces;
using Newtonsoft.Json.Linq;
using WorkflowCtx = FlowForge.Core.Interfaces.ExecutionContext;

namespace FlowForge.Infrastructure.Services;

public class ExpressionEvaluator : IExpressionEvaluator
{
    private static readonly Regex ExpressionPattern = new(@"\{\{(.+?)\}\}", RegexOptions.Compiled);

    public string Evaluate(string expression, JObject? currentItem, WorkflowCtx context, string? currentNodeName = null)
    {
        if (string.IsNullOrEmpty(expression)) return expression;

        return ExpressionPattern.Replace(expression, match =>
        {
            var expr = match.Groups[1].Value.Trim();
            try
            {
                return EvaluateExpression(expr, currentItem, context) ?? match.Value;
            }
            catch
            {
                return match.Value;
            }
        });
    }

    public JObject EvaluateObject(JObject template, JObject? currentItem, WorkflowCtx context, string? currentNodeName = null)
    {
        var result = new JObject();
        foreach (var prop in template.Properties())
        {
            result[prop.Name] = prop.Value.Type == JTokenType.String
                ? Evaluate(prop.Value.ToString(), currentItem, context, currentNodeName)
                : prop.Value.DeepClone();
        }
        return result;
    }

    private string? EvaluateExpression(string expr, JObject? currentItem, WorkflowCtx context)
    {
        // $json.field or $json['field']
        if (expr.StartsWith("$json"))
        {
            if (currentItem == null) return null;
            var path = expr[5..].TrimStart('.').Replace("['", ".").Replace("']", "");
            return currentItem.SelectToken(path.StartsWith("$") ? path : "$." + path.TrimStart('.'))?.ToString();
        }

        // $node['NodeName'].json[0].field
        if (expr.StartsWith("$node["))
        {
            var nodeMatch = Regex.Match(expr, @"\$node\['(.+?)'\]\.json\[?(\d+)?\]?\.?(.*)");
            if (nodeMatch.Success)
            {
                var nodeName = nodeMatch.Groups[1].Value;
                var indexStr = nodeMatch.Groups[2].Value;
                var fieldPath = nodeMatch.Groups[3].Value;

                var nodeOutput = context.NodeOutputs.FirstOrDefault(x => true); // simplified
                // Find by name would require node name mapping — return empty for now
                return null;
            }
        }

        // $vars.key
        if (expr.StartsWith("$vars."))
        {
            var key = expr[6..];
            return context.Variables.TryGetValue(key, out var val) ? val?.ToString() : null;
        }

        // $env.KEY
        if (expr.StartsWith("$env."))
        {
            var key = expr[5..];
            return Environment.GetEnvironmentVariable(key);
        }

        // $workflow.id
        if (expr == "$workflow.id") return context.WorkflowId.ToString();
        if (expr == "$execution.id") return context.ExecutionId.ToString();

        // $today / $now
        if (expr == "$today") return DateTime.UtcNow.ToString("yyyy-MM-dd");
        if (expr == "$now") return DateTime.UtcNow.ToString("O");

        // Simple numeric literals
        if (double.TryParse(expr, out var num)) return num.ToString();

        return null;
    }
}
