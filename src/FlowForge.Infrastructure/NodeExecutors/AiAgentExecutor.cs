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
        var systemPrompt = context.GetConfigString("systemPrompt",
            "You are an intelligent AI agent with access to models, memory, and tools.");
        var task = context.GetConfigString("task");
        var maxIterations = context.GetConfig<int>("maxIterations", 10);

        // Default model configuration if no ChatModel nodes are connected
        var defaultModel = context.GetConfigString("model", "gpt-4o-mini");
        var defaultProvider = "openai";
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
                // Initialize kernel with model (from connected ChatModel node or fallback)
                var builder = Kernel.CreateBuilder();
                
                // In future, resolve model from connected ChatModel nodes
                // For now, use configuration or default
                builder.AddOpenAIChatCompletion(defaultModel, apiKey);
                var kernel = builder.Build();

                // TODO: Dynamically load and register tools from connected ToolNode nodes
                // TODO: Load and configure memory from connected MemoryNode nodes
                // These would be registered as SK plugins or custom functions

                // Build the agent prompt with available tools and memory context
                var agentPrompt = BuildAgentPrompt(systemPrompt, taskText, maxIterations);

                var function = KernelFunctionFactory.CreateFromPrompt(
                    agentPrompt,
                    new PromptExecutionSettings { ExtensionData = new Dictionary<string, object> { ["max_tokens"] = 4000 } });

                var result = await kernel.InvokeAsync(function);
                var output = result.GetValue<string>() ?? "";

                results.Add(new JObject
                {
                    ["output"] = output,
                    ["task"] = taskText,
                    ["model"] = defaultModel,
                    ["agentType"] = "flexible_ai_agent",
                    ["iterations"] = 0,  // Would track actual iterations when tools are connected
                    ["toolsUsed"] = new JArray(),  // Would track which tools were invoked
                });
            }
            catch (Exception ex)
            {
                return new NodeExecutionResult { Success = false, ErrorMessage = ex.Message };
            }
        }
        return new NodeExecutionResult { Success = true, Items = results };
    }

    private string BuildAgentPrompt(string systemPrompt, string task, int maxIterations)
    {
        return $@"{systemPrompt}

You are tasked with the following objective:
{task}

Guidelines:
- You have access to AI models, memory systems, and tools via connections
- Think step-by-step about how to accomplish this task
- You can use any connected tools to gather information or perform actions
- Store important information in connected memory systems for continuity
- Iterate up to {maxIterations} times if needed
- Provide a clear final answer or result

Begin your task now:";
    }
}

