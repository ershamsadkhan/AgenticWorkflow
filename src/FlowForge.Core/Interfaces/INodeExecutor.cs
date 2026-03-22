using FlowForge.Core.Enums;
using Newtonsoft.Json.Linq;

namespace FlowForge.Core.Interfaces;

public interface INodeExecutor
{
    NodeType NodeType { get; }
    Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context);
}

public class WorkflowNodeContext
{
    public Guid NodeId { get; set; }
    public string NodeName { get; set; } = string.Empty;
    public string? Configuration { get; set; } // JSON config
    public Guid? CredentialId { get; set; }
    public List<JObject> InputItems { get; set; } = new();
    public ExecutionContext ExecutionContext { get; set; } = null!;

    public T GetConfig<T>(string key, T defaultValue = default!)
    {
        if (string.IsNullOrEmpty(Configuration)) return defaultValue;
        try
        {
            var obj = JObject.Parse(Configuration);
            var token = obj[key];
            if (token == null) return defaultValue;
            return token.ToObject<T>() ?? defaultValue;
        }
        catch { return defaultValue; }
    }

    public string GetConfigString(string key, string defaultValue = "")
    {
        if (string.IsNullOrEmpty(Configuration)) return defaultValue;
        try
        {
            var obj = JObject.Parse(Configuration);
            return obj[key]?.ToString() ?? defaultValue;
        }
        catch { return defaultValue; }
    }
}
