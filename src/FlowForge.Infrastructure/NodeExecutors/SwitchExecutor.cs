using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using Newtonsoft.Json.Linq;

namespace FlowForge.Infrastructure.NodeExecutors;

public class SwitchExecutor : INodeExecutor
{
    private readonly IExpressionEvaluator _evaluator;
    public SwitchExecutor(IExpressionEvaluator evaluator) => _evaluator = evaluator;
    public NodeType NodeType => NodeType.Switch;

    public Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        var switchField = context.GetConfigString("field");
        var cases = context.GetConfig<List<JObject>>("cases") ?? new();
        var outputs = new Dictionary<string, List<JObject>>();

        foreach (var item in context.InputItems)
        {
            var fieldValue = _evaluator.Evaluate($"{{{{$json.{switchField}}}}}", item, context.ExecutionContext);
            var matched = false;
            foreach (var switchCase in cases)
            {
                var caseValue = switchCase["value"]?.ToString();
                var outputHandle = switchCase["output"]?.ToString() ?? "output0";
                if (fieldValue == caseValue)
                {
                    if (!outputs.ContainsKey(outputHandle)) outputs[outputHandle] = new();
                    outputs[outputHandle].Add(item);
                    matched = true;
                    break;
                }
            }
            if (!matched)
            {
                const string defaultOutput = "default";
                if (!outputs.ContainsKey(defaultOutput)) outputs[defaultOutput] = new();
                outputs[defaultOutput].Add(item);
            }
        }

        return Task.FromResult(new NodeExecutionResult
        {
            Success = true,
            Items = context.InputItems,
            ConditionalOutputs = outputs
        });
    }
}
