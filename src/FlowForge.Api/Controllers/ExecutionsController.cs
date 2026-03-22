using System.Security.Claims;
using FlowForge.Api.DTOs;
using FlowForge.Core.Entities;
using FlowForge.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;

namespace FlowForge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExecutionsController : ControllerBase
{
    private readonly IWorkflowRepository _repo;
    private readonly IExecutionEngine _engine;

    public ExecutionsController(IWorkflowRepository repo, IExecutionEngine engine)
    {
        _repo = repo;
        _engine = engine;
    }

    [HttpGet("workflow/{workflowId}")]
    public async Task<ActionResult<IEnumerable<ExecutionDto>>> GetByWorkflow(Guid workflowId, [FromQuery] int page = 1)
    {
        var executions = await _repo.GetExecutionsAsync(workflowId, page);
        return Ok(executions.Select(MapExecution));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ExecutionDto>> GetById(Guid id)
    {
        var execution = await _repo.GetExecutionByIdAsync(id);
        if (execution == null) return NotFound();
        return Ok(MapExecution(execution));
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExecutionDto>>> GetAll([FromQuery] int page = 1)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var executions = await _repo.GetAllExecutionsAsync(userId, page);
        return Ok(executions.Select(MapExecution));
    }

    [HttpPost("run/{workflowId}")]
    public async Task<ActionResult<ExecutionDto>> RunWorkflow(Guid workflowId, [FromBody] ExecutionRequest? request = null)
    {
        var triggerData = request?.TriggerData != null
            ? new List<JObject> { JObject.FromObject(request.TriggerData) }
            : null;
        var execution = await _engine.ExecuteAsync(workflowId, "manual", triggerData);
        return Ok(MapExecution(execution));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _repo.DeleteExecutionAsync(id);
        return NoContent();
    }

    private static ExecutionDto MapExecution(WorkflowExecution e) => new(
        e.Id, e.WorkflowId, e.Workflow?.Name ?? "",
        e.Status, e.StartedAt, e.FinishedAt, e.DurationMs, e.ErrorMessage, e.Mode,
        e.NodeExecutions?.Select(ne => new NodeExecutionDto(
            ne.Id, ne.NodeId, ne.Node?.Name ?? ne.NodeId.ToString(),
            ne.Status, ne.StartedAt, ne.FinishedAt, ne.DurationMs,
            ne.InputData, ne.OutputData, ne.ErrorMessage)).ToList());
}
