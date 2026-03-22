using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Newtonsoft.Json.Linq;

namespace FlowForge.Infrastructure.NodeExecutors;

public class AiAgentExecutor : INodeExecutor
{
    private readonly IConfiguration _config;
    private readonly IExpressionEvaluator _evaluator;

    public AiAgentExecutor(IConfiguration config, IExpressionEvaluator evaluator)
    {
        _config = config;
        _evaluator = evaluator;
    }

    public NodeType NodeType => NodeType.AiAgent;

    public async Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        var model = context.GetConfigString("model", "gpt-4o");
        var systemPrompt = context.GetConfigString("systemPrompt",
            "You are an AI agent. Use available tools to complete the task.");
        var task = context.GetConfigString("task");

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
            var taskText = _evaluator.Evaluate(task, item, context.ExecutionContext);
            if (string.IsNullOrEmpty(taskText))
                taskText = item["task"]?.ToString() ?? item["prompt"]?.ToString() ?? "Complete the task.";

            try
            {
                var builder = Kernel.CreateBuilder();
                builder.AddOpenAIChatCompletion(model, apiKey);
                var kernel = builder.Build();

                // Add built-in tools via SK plugins
                var function = KernelFunctionFactory.CreateFromPrompt(
                    systemPrompt + "\n\nTask: " + taskText,
                    new PromptExecutionSettings { ExtensionData = new Dictionary<string, object> { ["max_tokens"] = 2000 } });

                var result = await kernel.InvokeAsync(function);
                var output = result.GetValue<string>() ?? "";

                results.Add(new JObject
                {
                    ["output"] = output,
                    ["task"] = taskText,
                    ["model"] = model,
                    ["agentType"] = "ai_agent"
                });
            }
            catch (Exception ex)
            {
                return new NodeExecutionResult { Success = false, ErrorMessage = ex.Message };
            }
        }
        return new NodeExecutionResult { Success = true, Items = results };
    }
}
