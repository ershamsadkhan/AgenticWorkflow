using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Newtonsoft.Json.Linq;

namespace FlowForge.Infrastructure.NodeExecutors;

public class AiChatExecutor : INodeExecutor
{
    private readonly IConfiguration _config;
    private readonly IExpressionEvaluator _evaluator;

    public AiChatExecutor(IConfiguration config, IExpressionEvaluator evaluator)
    {
        _config = config;
        _evaluator = evaluator;
    }

    public NodeType NodeType => NodeType.AiChat;

    public async Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        var results = new List<JObject>();
        var model = context.GetConfigString("model", "gpt-4o-mini");
        var systemPrompt = context.GetConfigString("systemPrompt", "You are a helpful assistant.");
        var maxTokens = context.GetConfig<int>("maxTokens", 1000);

        // Get API key from credential or config
        string? apiKey = null;
        if (context.CredentialId.HasValue &&
            context.ExecutionContext.Credentials.TryGetValue(context.CredentialId.Value, out var cred))
            apiKey = cred.GetValueOrDefault("apiKey");
        apiKey ??= _config["OpenAI:ApiKey"];

        if (string.IsNullOrEmpty(apiKey))
            return new NodeExecutionResult { Success = false, ErrorMessage = "OpenAI API key required" };

        foreach (var item in context.InputItems)
        {
            var userMessage = _evaluator.Evaluate(context.GetConfigString("prompt"), item, context.ExecutionContext);
            if (string.IsNullOrEmpty(userMessage))
                userMessage = item["text"]?.ToString() ?? item["message"]?.ToString() ?? item.ToString();

            try
            {
                var builder = Kernel.CreateBuilder();
                builder.AddOpenAIChatCompletion(model, apiKey);
                var kernel = builder.Build();
                var chatService = kernel.GetRequiredService<IChatCompletionService>();

                var history = new ChatHistory(systemPrompt);
                history.AddUserMessage(userMessage);

                var response = await chatService.GetChatMessageContentAsync(history);
                var content = response.Content ?? "";

                results.Add(new JObject
                {
                    ["response"] = content,
                    ["model"] = model,
                    ["inputText"] = userMessage,
                    ["finishReason"] = "stop"
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
