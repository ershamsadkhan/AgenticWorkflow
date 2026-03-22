namespace FlowForge.Core.Interfaces;

public interface ISchedulerService
{
    Task ScheduleWorkflowAsync(Guid workflowId, string cronExpression);
    Task UnscheduleWorkflowAsync(Guid workflowId);
    Task RescheduleAllAsync();
}
