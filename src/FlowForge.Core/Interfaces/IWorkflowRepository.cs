using FlowForge.Core.Entities;

namespace FlowForge.Core.Interfaces;

public interface IWorkflowRepository
{
    Task<IEnumerable<Workflow>> GetAllAsync(Guid userId);
    Task<Workflow?> GetByIdAsync(Guid id);
    Task<Workflow?> GetByWebhookPathAsync(string webhookPath);
    Task<Workflow> CreateAsync(Workflow workflow);
    Task<Workflow> UpdateAsync(Workflow workflow);
    Task DeleteAsync(Guid id);
    Task<IEnumerable<WorkflowExecution>> GetExecutionsAsync(Guid workflowId, int page = 1, int pageSize = 20);
    Task<IEnumerable<WorkflowExecution>> GetAllExecutionsAsync(Guid userId, int page = 1, int pageSize = 20);
    Task<WorkflowExecution?> GetExecutionByIdAsync(Guid id);
    Task<WorkflowExecution> CreateExecutionAsync(WorkflowExecution execution);
    Task<WorkflowExecution> UpdateExecutionAsync(WorkflowExecution execution);
    Task DeleteExecutionAsync(Guid id);
    Task<DashboardStats> GetDashboardStatsAsync(Guid userId);
}

public class DashboardStats
{
    public int TotalWorkflows { get; set; }
    public int ActiveWorkflows { get; set; }
    public int TotalExecutions { get; set; }
    public int SuccessfulExecutions { get; set; }
    public int FailedExecutions { get; set; }
    public double SuccessRate { get; set; }
    public List<ExecutionTrend> RecentTrend { get; set; } = new();
}

public class ExecutionTrend
{
    public string Date { get; set; } = string.Empty;
    public int Success { get; set; }
    public int Failed { get; set; }
}
