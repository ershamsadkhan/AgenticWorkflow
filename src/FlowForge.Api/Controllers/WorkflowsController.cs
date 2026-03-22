using System.Security.Claims;
using FlowForge.Api.DTOs;
using FlowForge.Core.Entities;
using FlowForge.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlowForge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WorkflowsController : ControllerBase
{
    private readonly IWorkflowRepository _repo;

    public WorkflowsController(IWorkflowRepository repo) => _repo = repo;

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkflowListDto>>> GetAll()
    {
        var workflows = await _repo.GetAllAsync(UserId);
        return Ok(workflows.Select(w => new WorkflowListDto(
            w.Id, w.Name, w.Description, w.Status, w.TriggerType,
            w.Tags, w.Nodes.Count, w.Executions.Count,
            w.CreatedAt, w.UpdatedAt)));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WorkflowDetailDto>> GetById(Guid id)
    {
        var w = await _repo.GetByIdAsync(id);
        if (w == null) return NotFound();

        return Ok(new WorkflowDetailDto(
            w.Id, w.Name, w.Description, w.Status, w.TriggerType,
            w.CronExpression, w.WebhookPath, w.Tags, w.Version,
            w.CreatedAt, w.UpdatedAt,
            w.Nodes.Select(n => new WorkflowNodeDto(
                n.Id, n.Name, n.Label, n.Type, n.PositionX, n.PositionY,
                n.Configuration, n.IsDisabled, n.Notes, n.ExecutionOrder, n.CredentialId)).ToList(),
            w.Connections.Select(c => new NodeConnectionDto(
                c.Id, c.SourceNodeId, c.TargetNodeId,
                c.SourceHandle, c.TargetHandle, c.Label, c.Condition)).ToList()));
    }

    [HttpPost]
    public async Task<ActionResult<WorkflowDetailDto>> Create(WorkflowCreateDto dto)
    {
        var workflow = new Workflow
        {
            Name = dto.Name,
            Description = dto.Description,
            TriggerType = dto.TriggerType,
            CronExpression = dto.CronExpression,
            Tags = dto.Tags,
            UserId = UserId,
            WebhookPath = $"/webhook/{Guid.NewGuid():N}"
        };

        if (dto.Nodes != null)
        {
            foreach (var n in dto.Nodes)
            {
                workflow.Nodes.Add(new WorkflowNode
                {
                    Id = n.Id == Guid.Empty ? Guid.NewGuid() : n.Id,
                    Name = n.Name, Label = n.Label, Type = n.Type,
                    PositionX = n.PositionX, PositionY = n.PositionY,
                    Configuration = n.Configuration, IsDisabled = n.IsDisabled,
                    Notes = n.Notes, ExecutionOrder = n.ExecutionOrder,
                    CredentialId = n.CredentialId
                });
            }
        }

        if (dto.Connections != null)
        {
            foreach (var c in dto.Connections)
            {
                workflow.Connections.Add(new NodeConnection
                {
                    Id = c.Id == Guid.Empty ? Guid.NewGuid() : c.Id,
                    SourceNodeId = c.SourceNodeId, TargetNodeId = c.TargetNodeId,
                    SourceHandle = c.SourceHandle, TargetHandle = c.TargetHandle,
                    Label = c.Label, Condition = c.Condition
                });
            }
        }

        var created = await _repo.CreateAsync(workflow);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(Guid id, WorkflowUpdateDto dto)
    {
        var existing = await _repo.GetByIdAsync(id);
        if (existing == null) return NotFound();

        var workflow = new Workflow
        {
            Id = id,
            Name = dto.Name,
            Description = dto.Description,
            Status = dto.Status,
            TriggerType = dto.TriggerType,
            CronExpression = dto.CronExpression,
            WebhookPath = existing.WebhookPath,
            Tags = dto.Tags,
            Version = existing.Version + 1,
            UserId = UserId,
            CreatedAt = existing.CreatedAt
        };

        workflow.Nodes = dto.Nodes.Select(n => new WorkflowNode
        {
            Id = n.Id == Guid.Empty ? Guid.NewGuid() : n.Id,
            Name = n.Name, Label = n.Label, Type = n.Type,
            PositionX = n.PositionX, PositionY = n.PositionY,
            Configuration = n.Configuration, IsDisabled = n.IsDisabled,
            Notes = n.Notes, ExecutionOrder = n.ExecutionOrder,
            CredentialId = n.CredentialId
        }).ToList();

        workflow.Connections = dto.Connections.Select(c => new NodeConnection
        {
            Id = c.Id == Guid.Empty ? Guid.NewGuid() : c.Id,
            SourceNodeId = c.SourceNodeId, TargetNodeId = c.TargetNodeId,
            SourceHandle = c.SourceHandle, TargetHandle = c.TargetHandle,
            Label = c.Label, Condition = c.Condition
        }).ToList();

        await _repo.UpdateAsync(workflow);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        await _repo.DeleteAsync(id);
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStats>> GetStats()
    {
        return Ok(await _repo.GetDashboardStatsAsync(UserId));
    }
}
