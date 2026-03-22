using FlowForge.Core.Entities;
using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using FlowForge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FlowForge.Infrastructure.Repositories;

public class WorkflowRepository : IWorkflowRepository
{
    private readonly AppDbContext _db;
    public WorkflowRepository(AppDbContext db) => _db = db;

    public async Task<IEnumerable<Workflow>> GetAllAsync(Guid userId) =>
        await _db.Workflows.AsNoTracking()
            .Where(w => w.UserId == userId)
            .Include(w => w.Nodes)
            .Include(w => w.Connections)
            .OrderByDescending(w => w.UpdatedAt)
            .ToListAsync();

    public async Task<Workflow?> GetByIdAsync(Guid id) =>
        await _db.Workflows.AsNoTracking()
            .Include(w => w.Nodes)
            .Include(w => w.Connections)
            .Include(w => w.Executions.OrderByDescending(e => e.StartedAt).Take(5))
            .FirstOrDefaultAsync(w => w.Id == id);

    public async Task<Workflow?> GetByWebhookPathAsync(string webhookPath) =>
        await _db.Workflows
            .Include(w => w.Nodes).ThenInclude(n => n.Credential)
            .Include(w => w.Connections)
            .FirstOrDefaultAsync(w => w.WebhookPath == webhookPath && w.Status == WorkflowStatus.Active);

    public async Task<Workflow> CreateAsync(Workflow workflow)
    {
        _db.Workflows.Add(workflow);
        await _db.SaveChangesAsync();
        return workflow;
    }

    public async Task<Workflow> UpdateAsync(Workflow workflow)
    {
        workflow.UpdatedAt = DateTime.UtcNow;

        // Delete NodeExecutions referencing old nodes before deleting the nodes
        var executionIds = await _db.WorkflowExecutions
            .Where(e => e.WorkflowId == workflow.Id).Select(e => e.Id).ToListAsync();
        if (executionIds.Count > 0)
            await _db.NodeExecutions.Where(ne => executionIds.Contains(ne.WorkflowExecutionId)).ExecuteDeleteAsync();

        await _db.NodeConnections.Where(c => c.WorkflowId == workflow.Id).ExecuteDeleteAsync();
        await _db.WorkflowNodes.Where(n => n.WorkflowId == workflow.Id).ExecuteDeleteAsync();

        foreach (var entry in _db.ChangeTracker.Entries().ToList())
            entry.State = EntityState.Detached;

        _db.Workflows.Attach(workflow);
        _db.Entry(workflow).State = EntityState.Modified;

        foreach (var node in workflow.Nodes)
        {
            node.WorkflowId = workflow.Id;
            if (node.Id == Guid.Empty) node.Id = Guid.NewGuid();
            _db.WorkflowNodes.Add(node);
        }
        foreach (var conn in workflow.Connections)
        {
            conn.WorkflowId = workflow.Id;
            if (conn.Id == Guid.Empty) conn.Id = Guid.NewGuid();
            _db.NodeConnections.Add(conn);
        }
        await _db.SaveChangesAsync();
        return workflow;
    }

    public async Task DeleteAsync(Guid id)
    {
        var executionIds = await _db.WorkflowExecutions
            .Where(e => e.WorkflowId == id).Select(e => e.Id).ToListAsync();
        if (executionIds.Count > 0)
            await _db.NodeExecutions.Where(ne => executionIds.Contains(ne.WorkflowExecutionId)).ExecuteDeleteAsync();
        await _db.WorkflowExecutions.Where(e => e.WorkflowId == id).ExecuteDeleteAsync();
        await _db.NodeConnections.Where(c => c.WorkflowId == id).ExecuteDeleteAsync();
        await _db.WorkflowNodes.Where(n => n.WorkflowId == id).ExecuteDeleteAsync();
        await _db.Workflows.Where(w => w.Id == id).ExecuteDeleteAsync();
    }

    public async Task<IEnumerable<WorkflowExecution>> GetExecutionsAsync(Guid workflowId, int page = 1, int pageSize = 20) =>
        await _db.WorkflowExecutions.AsNoTracking()
            .Where(e => e.WorkflowId == workflowId)
            .Include(e => e.NodeExecutions).ThenInclude(ne => ne.Node)
            .OrderByDescending(e => e.StartedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();

    public async Task<IEnumerable<WorkflowExecution>> GetAllExecutionsAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        var workflowIds = await _db.Workflows.Where(w => w.UserId == userId).Select(w => w.Id).ToListAsync();
        return await _db.WorkflowExecutions.AsNoTracking()
            .Where(e => workflowIds.Contains(e.WorkflowId))
            .Include(e => e.Workflow)
            .Include(e => e.NodeExecutions)
            .OrderByDescending(e => e.StartedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();
    }

    public async Task<WorkflowExecution?> GetExecutionByIdAsync(Guid id) =>
        await _db.WorkflowExecutions.AsNoTracking()
            .Include(e => e.NodeExecutions).ThenInclude(ne => ne.Node)
            .Include(e => e.Workflow)
            .FirstOrDefaultAsync(e => e.Id == id);

    public async Task<WorkflowExecution> CreateExecutionAsync(WorkflowExecution execution)
    {
        _db.WorkflowExecutions.Add(execution);
        await _db.SaveChangesAsync();
        return execution;
    }

    public async Task<WorkflowExecution> UpdateExecutionAsync(WorkflowExecution execution)
    {
        _db.WorkflowExecutions.Update(execution);
        await _db.SaveChangesAsync();
        return execution;
    }

    public async Task DeleteExecutionAsync(Guid id)
    {
        await _db.NodeExecutions.Where(ne => ne.WorkflowExecutionId == id).ExecuteDeleteAsync();
        await _db.WorkflowExecutions.Where(e => e.Id == id).ExecuteDeleteAsync();
    }

    public async Task<DashboardStats> GetDashboardStatsAsync(Guid userId)
    {
        var workflows = await _db.Workflows.AsNoTracking().Where(w => w.UserId == userId).ToListAsync();
        var workflowIds = workflows.Select(w => w.Id).ToList();
        var executions = await _db.WorkflowExecutions.AsNoTracking()
            .Where(e => workflowIds.Contains(e.WorkflowId)).ToListAsync();

        var last7Days = Enumerable.Range(0, 7)
            .Select(i => DateTime.UtcNow.Date.AddDays(-i)).Reverse().ToList();

        var trend = last7Days.Select(date => new ExecutionTrend
        {
            Date = date.ToString("MMM dd"),
            Success = executions.Count(e => e.StartedAt.Date == date && e.Status == ExecutionStatus.Success),
            Failed = executions.Count(e => e.StartedAt.Date == date && e.Status == ExecutionStatus.Failed)
        }).ToList();

        var total = executions.Count;
        var success = executions.Count(e => e.Status == ExecutionStatus.Success);
        return new DashboardStats
        {
            TotalWorkflows = workflows.Count,
            ActiveWorkflows = workflows.Count(w => w.Status == WorkflowStatus.Active),
            TotalExecutions = total,
            SuccessfulExecutions = success,
            FailedExecutions = executions.Count(e => e.Status == ExecutionStatus.Failed),
            SuccessRate = total > 0 ? Math.Round((double)success / total * 100, 1) : 0,
            RecentTrend = trend
        };
    }
}
