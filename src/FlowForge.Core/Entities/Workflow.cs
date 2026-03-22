using FlowForge.Core.Enums;

namespace FlowForge.Core.Entities;

public class Workflow
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public WorkflowStatus Status { get; set; } = WorkflowStatus.Draft;
    public TriggerType TriggerType { get; set; } = TriggerType.Manual;
    public string? CronExpression { get; set; }
    public string? WebhookPath { get; set; }
    public string? Tags { get; set; }
    public int Version { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public ICollection<WorkflowNode> Nodes { get; set; } = new List<WorkflowNode>();
    public ICollection<NodeConnection> Connections { get; set; } = new List<NodeConnection>();
    public ICollection<WorkflowExecution> Executions { get; set; } = new List<WorkflowExecution>();
}
