namespace FlowForge.Core.Entities;

public class WorkflowTag
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#6366f1";
    public Guid UserId { get; set; }
}
