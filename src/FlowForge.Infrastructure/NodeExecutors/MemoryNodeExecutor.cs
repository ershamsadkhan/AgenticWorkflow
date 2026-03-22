using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using Newtonsoft.Json.Linq;

namespace FlowForge.Infrastructure.NodeExecutors;

public class MemoryNodeExecutor : INodeExecutor
{
    public NodeType NodeType => NodeType.MemoryNode;

    public async Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        var memoryType = context.GetConfigString("memoryType", "redis");
        var connectionString = context.GetConfigString("connectionString", "");
        var keyPrefix = context.GetConfigString("keyPrefix", "agent_");
        var ttl = context.GetConfig<int>("ttl", 3600);

        if (string.IsNullOrEmpty(connectionString))
            return new NodeExecutionResult { Success = false, ErrorMessage = "Connection string is required" };

        var results = new List<JObject>();
        foreach (var item in context.InputItems)
        {
            results.Add(new JObject
            {
                ["memoryType"] = memoryType,
                ["keyPrefix"] = keyPrefix,
                ["ttl"] = ttl,
                ["memoryConfig"] = new JObject
                {
                    ["type"] = "memory",
                    ["memoryType"] = memoryType,
                    ["connectionString"] = maskConnectionString(connectionString),
                    ["keyPrefix"] = keyPrefix,
                    ["ttl"] = ttl
                }
            });
        }

        return new NodeExecutionResult { Success = true, Items = results };
    }

    private string maskConnectionString(string connectionString)
    {
        if (string.IsNullOrEmpty(connectionString)) return "";
        if (connectionString.Length <= 10) return connectionString;
        return connectionString.Substring(0, 10) + "***";
    }
}
