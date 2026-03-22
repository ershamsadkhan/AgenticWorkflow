using FlowForge.Core.Enums;

namespace FlowForge.Core.Entities;

public class WorkflowExecution
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ExecutionStatus Status { get; set; } = ExecutionStatus.Pending;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? FinishedAt { get; set; }
    public long? DurationMs { get; set; }
    public string? ErrorMessage { get; set; }
    public string? TriggerData { get; set; } // JSON
    public string? ResultData { get; set; }  // JSON
    public int RetryCount { get; set; }
    public string Mode { get; set; } = "manual"; // manual, webhook, schedule

    public Guid WorkflowId { get; set; }
    public Workflow Workflow { get; set; } = null!;

    public ICollection<NodeExecution> NodeExecutions { get; set; } = new List<NodeExecution>();
}
