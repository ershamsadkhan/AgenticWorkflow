namespace FlowForge.Core.Enums;

public enum NodeType
{
    // Triggers
    Trigger = 0,
    Webhook = 8,
    Schedule = 9,
    ChatMessage = 40,
    // Actions
    HttpRequest = 5,
    Code = 6,
    Email = 7,
    SqlQuery = 20,
    Slack = 21,
    // AI
    AiChat = 30,
    AiAgent = 31,
    TextSummarizer = 32,
    ChatModel = 41,        // AI Models (GPT-4, Claude, etc.)
    ToolNode = 42,         // Reusable Tools for Agents
    MemoryNode = 43,       // Memory systems (Redis, Vector DB, etc.)
    // Logic
    Condition = 2,
    Switch = 14,
    Loop = 3,
    Delay = 4,
    // Data
    Transform = 10,
    Filter = 11,
    Merge = 12,
    Split = 13,
    Set = 22,
    // Advanced
    SubWorkflow = 15,
    Action = 1,
}
