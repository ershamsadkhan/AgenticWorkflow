using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using Newtonsoft.Json.Linq;

namespace FlowForge.Infrastructure.NodeExecutors;

public class ChatModelExecutor : INodeExecutor
{
    public NodeType NodeType => NodeType.ChatModel;

    public async Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        var provider = context.GetConfigString("provider", "openai");
        var modelName = context.GetConfigString("modelName", "gpt-4o");
        var temperature = context.GetConfig<double>("temperature", 0.7);
        var maxTokens = context.GetConfig<int>("maxTokens", 2000);

        var results = new List<JObject>();
        foreach (var item in context.InputItems)
        {
            results.Add(new JObject
            {
                ["provider"] = provider,
                ["modelName"] = modelName,
                ["temperature"] = temperature,
                ["maxTokens"] = maxTokens,
                ["modelConfig"] = new JObject
                {
                    ["type"] = "chat_model",
                    ["provider"] = provider,
                    ["model"] = modelName,
                    ["parameters"] = new JObject
                    {
                        ["temperature"] = temperature,
                        ["max_tokens"] = maxTokens
                    }
                }
            });
        }

        return new NodeExecutionResult { Success = true, Items = results };
    }
}
