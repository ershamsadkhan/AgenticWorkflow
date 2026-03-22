using FlowForge.Core.Enums;

namespace FlowForge.Core.Entities;

public class WorkflowNode
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Label { get; set; }
    public NodeType Type { get; set; }
    public double PositionX { get; set; }
    public double PositionY { get; set; }
    public string? Configuration { get; set; } // JSON config
    public string? InputSchema { get; set; }   // JSON schema
    public string? OutputSchema { get; set; }  // JSON schema
    public bool IsDisabled { get; set; }
    public string? Notes { get; set; }
    public int ExecutionOrder { get; set; }

    public Guid WorkflowId { get; set; }
    public Workflow Workflow { get; set; } = null!;

    public Guid? CredentialId { get; set; }
    public Credential? Credential { get; set; }

    public ICollection<NodeConnection> OutputConnections { get; set; } = new List<NodeConnection>();
    public ICollection<NodeConnection> InputConnections { get; set; } = new List<NodeConnection>();
}
