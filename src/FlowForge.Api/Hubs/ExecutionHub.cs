using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace FlowForge.Api.Hubs;

[Authorize]
public class ExecutionHub : Hub
{
    public async Task JoinWorkflowGroup(string workflowId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"workflow-{workflowId}");
    }

    public async Task LeaveWorkflowGroup(string workflowId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"workflow-{workflowId}");
    }
}
