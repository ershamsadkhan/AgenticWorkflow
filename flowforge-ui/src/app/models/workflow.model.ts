export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export type WorkflowStatus = 'Draft' | 'Active' | 'Inactive' | 'Error';
export type TriggerType = 'Manual' | 'Webhook' | 'Schedule' | 'Event';
export type ExecutionStatus = 'Pending' | 'Running' | 'Success' | 'Failed' | 'Cancelled';
export type NodeType =
  | 'Trigger' | 'Webhook' | 'Schedule' | 'ChatMessage'
  | 'HttpRequest' | 'Code' | 'Email' | 'SqlQuery' | 'Slack'
  | 'AiChat' | 'AiAgent' | 'TextSummarizer'
  | 'Condition' | 'Switch' | 'Loop' | 'Delay'
  | 'Transform' | 'Filter' | 'Merge' | 'Split' | 'Set'
  | 'SubWorkflow' | 'Action';

export interface WorkflowList {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  triggerType: TriggerType;
  tags?: string;
  nodeCount: number;
  executionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowDetail {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  triggerType: TriggerType;
  cronExpression?: string;
  webhookPath?: string;
  tags?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  nodes: WorkflowNode[];
  connections: NodeConnection[];
}

export interface WorkflowNode {
  id: string;
  name: string;
  label?: string;
  type: NodeType;
  positionX: number;
  positionY: number;
  configuration?: string;
  isDisabled: boolean;
  notes?: string;
  executionOrder: number;
  credentialId?: string;
}

export interface NodeConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle: string;
  targetHandle: string;
  label?: string;
  condition?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  errorMessage?: string;
  mode: string;
  nodeExecutions?: NodeExecution[];
}

export interface NodeExecution {
  id: string;
  nodeId: string;
  nodeName: string;
  status: ExecutionStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  inputData?: string;
  outputData?: string;
  errorMessage?: string;
}

export interface Credential {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface Variable {
  id: string;
  key: string;
  value?: string;
  type: 'string' | 'number' | 'boolean' | 'secret';
  scope: 'global' | 'workflow';
  workflowId?: string;
  description?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  recentTrend: { date: string; success: number; failed: number }[];
}

export interface NodeDefinition {
  type: NodeType;
  name: string;
  icon: string;
  color: string;
  category: string;
  description: string;
  inputs: number;
  outputs: number;
}

export const NODE_DEFINITIONS: NodeDefinition[] = [
  // Triggers
  { type: 'Trigger', name: 'Manual Trigger', icon: '▶', color: '#22c55e', category: 'Triggers', description: 'Start workflow manually', inputs: 0, outputs: 1 },
  { type: 'Webhook', name: 'Webhook', icon: '🔗', color: '#8b5cf6', category: 'Triggers', description: 'Listen for HTTP requests', inputs: 0, outputs: 1 },
  { type: 'Schedule', name: 'Schedule', icon: '⏱', color: '#f59e0b', category: 'Triggers', description: 'Run on a cron schedule', inputs: 0, outputs: 1 },
  { type: 'ChatMessage', name: 'When Chat Message Received', icon: '💬', color: '#ec4899', category: 'Triggers', description: 'Receive user messages from chat input', inputs: 0, outputs: 1 },
  // Actions
  { type: 'HttpRequest', name: 'HTTP Request', icon: '🌐', color: '#3b82f6', category: 'Actions', description: 'Make HTTP requests to any URL', inputs: 1, outputs: 1 },
  { type: 'Code', name: 'Code', icon: '{ }', color: '#6366f1', category: 'Actions', description: 'Run custom JavaScript code', inputs: 1, outputs: 1 },
  { type: 'Email', name: 'Send Email', icon: '✉', color: '#ec4899', category: 'Actions', description: 'Send an email via SMTP', inputs: 1, outputs: 1 },
  { type: 'SqlQuery', name: 'SQL Query', icon: '🗄', color: '#0ea5e9', category: 'Actions', description: 'Execute SQL Server queries', inputs: 1, outputs: 1 },
  { type: 'Slack', name: 'Slack', icon: '💬', color: '#4a154b', category: 'Actions', description: 'Send Slack messages', inputs: 1, outputs: 1 },
  // AI
  { type: 'AiChat', name: 'AI Chat', icon: '🤖', color: '#10b981', category: 'AI', description: 'Chat with AI (OpenAI)', inputs: 1, outputs: 1 },
  { type: 'AiAgent', name: 'AI Agent', icon: '🧠', color: '#059669', category: 'AI', description: 'Autonomous AI agent with tools', inputs: 1, outputs: 1 },
  { type: 'TextSummarizer', name: 'Summarize', icon: '📝', color: '#16a34a', category: 'AI', description: 'Summarize text with AI', inputs: 1, outputs: 1 },
  // Logic
  { type: 'Condition', name: 'IF', icon: '◇', color: '#f59e0b', category: 'Logic', description: 'Conditional branching (true/false)', inputs: 1, outputs: 2 },
  { type: 'Switch', name: 'Switch', icon: '⑂', color: '#f97316', category: 'Logic', description: 'Multi-path routing', inputs: 1, outputs: 4 },
  { type: 'Loop', name: 'Loop', icon: '↻', color: '#14b8a6', category: 'Logic', description: 'Iterate over all items', inputs: 1, outputs: 1 },
  { type: 'Delay', name: 'Wait', icon: '◷', color: '#64748b', category: 'Logic', description: 'Pause execution for a duration', inputs: 1, outputs: 1 },
  // Data
  { type: 'Set', name: 'Set', icon: '✏', color: '#a855f7', category: 'Data', description: 'Set or modify data fields', inputs: 1, outputs: 1 },
  { type: 'Transform', name: 'Transform', icon: '⚡', color: '#a855f7', category: 'Data', description: 'Remap data fields', inputs: 1, outputs: 1 },
  { type: 'Filter', name: 'Filter', icon: '⊘', color: '#06b6d4', category: 'Data', description: 'Filter items by conditions', inputs: 1, outputs: 1 },
  { type: 'Merge', name: 'Merge', icon: '⊕', color: '#10b981', category: 'Data', description: 'Combine multiple data streams', inputs: 2, outputs: 1 },
  { type: 'Split', name: 'Split', icon: '⊖', color: '#ef4444', category: 'Data', description: 'Split items into batches', inputs: 1, outputs: 2 },
  // Advanced
  { type: 'SubWorkflow', name: 'Sub-Workflow', icon: '↗', color: '#6366f1', category: 'Advanced', description: 'Execute another workflow', inputs: 1, outputs: 1 },
  { type: 'Action', name: 'Custom Action', icon: '⚙', color: '#78716c', category: 'Advanced', description: 'Generic action node', inputs: 1, outputs: 1 },
];
