using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using Newtonsoft.Json.Linq;

namespace FlowForge.Infrastructure.NodeExecutors;

/// <summary>
/// Executor for Chat Message trigger nodes that receive user input messages from the chat interface
/// </summary>
public class ChatMessageTriggerExecutor : INodeExecutor
{
    public NodeType NodeType => NodeType.ChatMessage;

    public Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        // Input items come from the chat message input
        // The chat UI sends a message in the input items with the structure:
        // { "message": "user message text", "timestamp": "...", "sender": "user" }
        var items = context.InputItems.Count > 0
            ? context.InputItems
            : new List<JObject> 
            { 
                new JObject 
                { 
                    ["message"] = "",
                    ["timestamp"] = DateTime.UtcNow.ToString("O"),
                    ["sender"] = "user"
                } 
            };

        return Task.FromResult(new NodeExecutionResult { Success = true, Items = items });
    }
}
