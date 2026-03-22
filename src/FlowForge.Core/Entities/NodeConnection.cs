namespace FlowForge.Core.Entities;

public class NodeConnection
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? Label { get; set; }
    public string SourceHandle { get; set; } = "output";
    public string TargetHandle { get; set; } = "input";
    public string? Condition { get; set; } // JSON condition for conditional paths

    public Guid WorkflowId { get; set; }
    public Workflow Workflow { get; set; } = null!;

    public Guid SourceNodeId { get; set; }
    public WorkflowNode SourceNode { get; set; } = null!;

    public Guid TargetNodeId { get; set; }
    public WorkflowNode TargetNode { get; set; } = null!;
}
