using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.SemanticKernel;
using Newtonsoft.Json.Linq;

namespace FlowForge.Infrastructure.NodeExecutors;

public class TextSummarizerExecutor : INodeExecutor
{
    private readonly IConfiguration _config;
    private readonly IExpressionEvaluator _evaluator;

    public TextSummarizerExecutor(IConfiguration config, IExpressionEvaluator evaluator)
    {
        _config = config;
        _evaluator = evaluator;
    }

    public NodeType NodeType => NodeType.TextSummarizer;

    public async Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        var textField = context.GetConfigString("textField", "text");
        var maxLength = context.GetConfig<int>("maxLength", 200);
        var style = context.GetConfigString("style", "concise");
        var model = context.GetConfigString("model", "gpt-4o-mini");

        string? apiKey = null;
        if (context.CredentialId.HasValue &&
            context.ExecutionContext.Credentials.TryGetValue(context.CredentialId.Value, out var cred))
            apiKey = cred.GetValueOrDefault("apiKey");
        apiKey ??= _config["OpenAI:ApiKey"];

        if (string.IsNullOrEmpty(apiKey))
            return new NodeExecutionResult { Success = false, ErrorMessage = "OpenAI API key required" };

        var results = new List<JObject>();
        foreach (var item in context.InputItems)
        {
            var text = item[textField]?.ToString()
                ?? _evaluator.Evaluate($"{{{{$json.{textField}}}}}", item, context.ExecutionContext)
                ?? item.ToString();

            try
            {
                var builder = Kernel.CreateBuilder();
                builder.AddOpenAIChatCompletion(model, apiKey);
                var kernel = builder.Build();

                var prompt = $"Summarize the following text in a {style} way, in at most {maxLength} words:\n\n{text}";
                var function = KernelFunctionFactory.CreateFromPrompt(prompt);
                var summaryResult = await kernel.InvokeAsync(function);
                var summary = summaryResult.GetValue<string>() ?? "";

                var output = (JObject)item.DeepClone();
                output["summary"] = summary;
                output["originalLength"] = text.Length;
                output["summaryLength"] = summary.Length;
                results.Add(output);
            }
            catch (Exception ex)
            {
                return new NodeExecutionResult { Success = false, ErrorMessage = ex.Message };
            }
        }
        return new NodeExecutionResult { Success = true, Items = results };
    }
}
