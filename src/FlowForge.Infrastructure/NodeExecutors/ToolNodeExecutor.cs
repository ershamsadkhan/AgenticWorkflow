using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using Newtonsoft.Json.Linq;

namespace FlowForge.Infrastructure.NodeExecutors;

public class ToolNodeExecutor : INodeExecutor
{
    public NodeType NodeType => NodeType.ToolNode;

    public async Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        var toolName = context.GetConfigString("toolName", "");
        var description = context.GetConfigString("description", "");
        var parametersJson = context.GetConfigString("parameters", "{}");
        var handlerId = context.GetConfigString("handlerId", "");

        if (string.IsNullOrEmpty(toolName))
            return new NodeExecutionResult { Success = false, ErrorMessage = "Tool name is required" };

        JObject parameters;
        try
        {
            parameters = JObject.Parse(parametersJson);
        }
        catch
        {
            parameters = new JObject();
        }

        var results = new List<JObject>();
        foreach (var item in context.InputItems)
        {
            results.Add(new JObject
            {
                ["toolName"] = toolName,
                ["description"] = description,
                ["handlerId"] = handlerId,
                ["toolDefinition"] = new JObject
                {
                    ["type"] = "tool",
                    ["name"] = toolName,
                    ["description"] = description,
                    ["parameters"] = parameters,
                    ["handlerId"] = handlerId
                }
            });
        }

        return new NodeExecutionResult { Success = true, Items = results };
    }
}
