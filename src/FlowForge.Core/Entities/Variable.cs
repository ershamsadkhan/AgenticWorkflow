namespace FlowForge.Core.Entities;

public class Variable
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Key { get; set; } = string.Empty;
    public string? Value { get; set; }
    public string Type { get; set; } = "string"; // string, number, boolean, secret
    public string Scope { get; set; } = "global"; // global, workflow
    public Guid? WorkflowId { get; set; }
    public Workflow? Workflow { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
