# FlowForge Flexible AI Agent Guide

## Overview

The AI Agent in FlowForge is now highly flexible and can dynamically connect to:
- **Chat Models** (GPT-4, Claude, Gemini, etc.)
- **Tools** (Web search, calculations, API calls, etc.)
- **Memory Systems** (Redis, Vector DBs, Long-term memory)

## Architecture

```
Trigger/Input
    ↓
[Chat Model] ←─┐
              │
[Tool] ←──────┤ → [AI Agent] → Output
              │                 ↓
[Memory] ←────┤          [Next Node / Output]
```

## How to Build a Flexible AI Agent

### Step 1: Create Chat Model Nodes
- Add a **Chat Model** node from the AI palette
- Configure:
  - **Provider**: OpenAI, Anthropic, Google, Azure
  - **Model Name**: Select specific model (gpt-4o, claude-3-opus, etc.)
  - **Temperature**: 0 (deterministic) to 2 (creative)
  - **Max Tokens**: Response length limit

### Step 2: Define Tool Nodes (Optional)
- Add **Tool** nodes for any custom functions
- Configure:
  - **Tool Name**: e.g., "web_search", "calculate", "send_email"
  - **Description**: What the tool does
  - **Input Parameters**: JSON schema of required parameters
  - **Handler ID**: Reference to Code node, HTTP endpoint, or sub-workflow

Example Tool Setup:
```
Tool: WebSearch
- Description: "Search the web for information"
- Parameters: {"query": "string", "limit": "number"}
- Handler: Points to HTTP endpoint or Code node
```

### Step 3: Set Up Memory (Optional)
- Add a **Memory** node for persistent state
- Configure:
  - **Memory Type**: Redis, Vector DB, Long-term (SQL), Short-term (Session)
  - **Connection String**: e.g., "redis://localhost:6379"
  - **Key Prefix**: Namespace for keys (e.g., "agent_")
  - **TTL**: Time-to-live in seconds (0 = no expiry)

### Step 4: Create the AI Agent
- Add **AI Agent** node to canvas
- Configure:
  - **System Instructions**: Define agent personality and behavior
  - **Task/Objective**: What the agent should accomplish
  - **Max Iterations**: Loop limit (default 10)
- **Connect** Chat Model(s), Tool(s), and Memory node(s) to it

### Step 5: Connect to Output
- Attach output nodes (HTTP Response, Slack, Database, etc.)
- Agent output includes:
  - `output`: Final response/result
  - `task`: Original task
  - `model`: Which model was used
  - `toolsUsed`: Array of tool names invoked
  - `iterations`: Number of loops executed

## Example Workflows

### Example 1: Research Agent
```
Manual Trigger
    ↓
[Chat Model: GPT-4o] ─┐
[Tool: WebSearch] ────┤→ [AI Agent: Research Task] → [Database: Store Result]
[Memory: Redis] ──────┘
```
Agent researches a topic using web search and stores findings in Redis.

### Example 2: Customer Support Agent
```
ChatMessage Trigger
    ↓
[ChatModel: Claude-3] ─┐
[Tool: KnowledgeBase] ─┤→ [AI Agent: Support] → [Slack: Send Response]
[Tool: SendEmail] ─────┤
[Memory: VectorDB] ────┘
```
Agent answers customer questions using knowledge base and can take actions.

### Example 3: Data Analysis Agent
```
Webhook Trigger (CSV upload)
    ↓
[Chat Model: GPT-4o] ───────┐
[Tool: DataProcessor] ───────┤→ [AI Agent: Analyze] → [Send Excel Report]
[Tool: VisualizationAPI] ────┤
[Memory: LongTerm] ──────────┘
```
Agent analyzes uploaded CSV files and generates reports.

## Dynamic Connection Flow

When the AI Agent executes:

1. **Agent Initialization**: Loads system instructions and task
2. **Model Resolution**: Uses connected ChatModel configuration
3. **Tool Registration**: Registers all connected Tools
4. **Memory Setup**: Initializes connection to Memory system
5. **Execution Loop**: 
   - Processes task
   - Decides which tool(s) to use
   - Calls tools and stores results in memory
   - Iterates until task complete or max iterations reached
6. **Output Generation**: Returns results with metadata

## Configuration Best Practices

### Multiple Models
- Connect different models for different strengths
- Agent can compare outputs for better decisions
- Useful for mixed workloads (fast vs. accurate)

### Tool Organization
- Group related tools together
- Provide clear, descriptive names
- Document parameter requirements
- Link to actual implementations (Code nodes, APIs)

### Memory Optimization
- Use short-term memory for session data
- Use vector DB for semantic search
- Use long-term memory for persistent state
- Set appropriate TTL values

### Security
- Connection strings are partially masked in logs
- Use credentials/secrets vault for sensitive data
- Tool handlers should validate inputs
- Memory access should be authenticated

## Advanced Features

### Tool Versioning
Connect multiple versions of same tool node:
```
[Tool: WebSearch v1.0] ┐
[Tool: WebSearch v2.0] ├→ [AI Agent]
```

### Model Comparison
Compare models in single agent:
```
[ChatModel: GPT-4o] ──┐
[ChatModel: Claude] ──┤→ [AI Agent: Compare]
```

### Memory Chains
Store and retrieve conversation history:
```
[Memory: Session] → [AI Agent] → [Memory: LongTerm]
```

## Troubleshooting

**Agent not using tools:**
- Verify tool handler IDs are valid
- Check tool parameter definitions
- Review agent logs in execution details

**Models not switching:**
- Ensure ChatModel node is connected
- Check provider configuration
- Verify API credentials are set

**Memory not persisting:**
- Test connection string in Memory node
- Check TTL settings (0 = forever)
- Monitor storage capacity

## Future Enhancements

Planned additions:
- Tool auto-discovery and registration
- Multi-agent coordination
- Advanced memory search (embedding-based)
- Tool execution monitoring dashboard
- Agent reasoning trace visualization
- Custom plugin SDK
