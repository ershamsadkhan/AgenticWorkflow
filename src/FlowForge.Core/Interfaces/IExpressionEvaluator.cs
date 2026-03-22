using Newtonsoft.Json.Linq;

namespace FlowForge.Core.Interfaces;

public interface IExpressionEvaluator
{
    string Evaluate(string expression, JObject? currentItem, ExecutionContext context, string? currentNodeName = null);
    JObject EvaluateObject(JObject template, JObject? currentItem, ExecutionContext context, string? currentNodeName = null);
}
