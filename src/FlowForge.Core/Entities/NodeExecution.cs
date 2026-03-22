using FlowForge.Core.Enums;

namespace FlowForge.Core.Entities;

public class NodeExecution
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ExecutionStatus Status { get; set; } = ExecutionStatus.Pending;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? FinishedAt { get; set; }
    public long? DurationMs { get; set; }
    public string? InputData { get; set; }   // JSON
    public string? OutputData { get; set; }  // JSON
    public string? ErrorMessage { get; set; }
    public int RetryCount { get; set; }

    public Guid WorkflowExecutionId { get; set; }
    public WorkflowExecution WorkflowExecution { get; set; } = null!;

    public Guid NodeId { get; set; }
    public WorkflowNode Node { get; set; } = null!;
}
