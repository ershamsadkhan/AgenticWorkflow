using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using FlowForge.Infrastructure.Data;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FlowForge.Infrastructure.Services;

public class SchedulerService : ISchedulerService
{
    private readonly AppDbContext _db;
    private readonly IRecurringJobManager _recurringJobManager;
    private readonly ILogger<SchedulerService> _logger;

    public SchedulerService(AppDbContext db, IRecurringJobManager recurringJobManager, ILogger<SchedulerService> logger)
    {
        _db = db;
        _recurringJobManager = recurringJobManager;
        _logger = logger;
    }

    public async Task ScheduleWorkflowAsync(Guid workflowId, string cronExpression)
    {
        var jobId = $"workflow-{workflowId}";
        _recurringJobManager.AddOrUpdate<IExecutionEngine>(
            jobId,
            engine => engine.ExecuteAsync(workflowId, "schedule", null, CancellationToken.None),
            cronExpression);
        _logger.LogInformation("Scheduled workflow {WorkflowId} with cron: {Cron}", workflowId, cronExpression);
        await Task.CompletedTask;
    }

    public async Task UnscheduleWorkflowAsync(Guid workflowId)
    {
        _recurringJobManager.RemoveIfExists($"workflow-{workflowId}");
        await Task.CompletedTask;
    }

    public async Task RescheduleAllAsync()
    {
        var workflows = await _db.Workflows
            .Where(w => w.Status == WorkflowStatus.Active &&
                        w.TriggerType == Core.Enums.TriggerType.Schedule &&
                        w.CronExpression != null)
            .ToListAsync();

        foreach (var w in workflows)
            await ScheduleWorkflowAsync(w.Id, w.CronExpression!);
    }
}
