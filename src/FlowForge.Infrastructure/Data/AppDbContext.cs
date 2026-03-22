using FlowForge.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace FlowForge.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Workflow> Workflows => Set<Workflow>();
    public DbSet<WorkflowNode> WorkflowNodes => Set<WorkflowNode>();
    public DbSet<NodeConnection> NodeConnections => Set<NodeConnection>();
    public DbSet<WorkflowExecution> WorkflowExecutions => Set<WorkflowExecution>();
    public DbSet<NodeExecution> NodeExecutions => Set<NodeExecution>();
    public DbSet<Credential> Credentials => Set<Credential>();
    public DbSet<WorkflowTag> WorkflowTags => Set<WorkflowTag>();
    public DbSet<Variable> Variables => Set<Variable>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<Workflow>(e =>
        {
            e.HasKey(w => w.Id);
            e.HasOne(w => w.User).WithMany(u => u.Workflows).HasForeignKey(w => w.UserId);
        });

        modelBuilder.Entity<WorkflowNode>(e =>
        {
            e.HasKey(n => n.Id);
            e.HasOne(n => n.Workflow).WithMany(w => w.Nodes).HasForeignKey(n => n.WorkflowId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(n => n.Credential).WithMany().HasForeignKey(n => n.CredentialId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<NodeConnection>(e =>
        {
            e.HasKey(c => c.Id);
            e.HasOne(c => c.Workflow).WithMany(w => w.Connections).HasForeignKey(c => c.WorkflowId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(c => c.SourceNode).WithMany(n => n.OutputConnections).HasForeignKey(c => c.SourceNodeId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(c => c.TargetNode).WithMany(n => n.InputConnections).HasForeignKey(c => c.TargetNodeId).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<WorkflowExecution>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Workflow).WithMany(w => w.Executions).HasForeignKey(x => x.WorkflowId).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<NodeExecution>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.WorkflowExecution).WithMany(we => we.NodeExecutions).HasForeignKey(x => x.WorkflowExecutionId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Node).WithMany().HasForeignKey(x => x.NodeId).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<Credential>(e =>
        {
            e.HasKey(c => c.Id);
            e.HasOne(c => c.User).WithMany(u => u.Credentials).HasForeignKey(c => c.UserId);
        });

        modelBuilder.Entity<WorkflowTag>(e =>
        {
            e.HasKey(t => t.Id);
        });

        modelBuilder.Entity<Variable>(e =>
        {
            e.HasKey(v => v.Id);
            e.HasOne(v => v.User).WithMany().HasForeignKey(v => v.UserId);
            e.HasOne(v => v.Workflow).WithMany().HasForeignKey(v => v.WorkflowId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        });

        // Seed admin user
        var adminId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = adminId,
            Email = "admin@flowforge.dev",
            PasswordHash = "JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIKk=",
            FirstName = "Admin",
            LastName = "User",
            Role = "Admin",
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}
