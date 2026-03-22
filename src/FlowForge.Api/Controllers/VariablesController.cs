using System.Security.Claims;
using FlowForge.Core.Entities;
using FlowForge.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlowForge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VariablesController : ControllerBase
{
    private readonly IVariableRepository _repo;
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    public VariablesController(IVariableRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<VariableDto>>> GetAll()
    {
        var vars = await _repo.GetAllAsync(UserId);
        return Ok(vars.Select(MapDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<VariableDto>> GetById(Guid id)
    {
        var v = await _repo.GetByIdAsync(id);
        return v == null ? NotFound() : Ok(MapDto(v));
    }

    [HttpPost]
    public async Task<ActionResult<VariableDto>> Create(VariableCreateDto dto)
    {
        var v = new Variable
        {
            Key = dto.Key,
            Value = dto.Value,
            Type = dto.Type,
            Scope = dto.Scope,
            WorkflowId = dto.WorkflowId,
            Description = dto.Description,
            UserId = UserId
        };
        var created = await _repo.CreateAsync(v);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, MapDto(created));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, VariableCreateDto dto)
    {
        var v = await _repo.GetByIdAsync(id);
        if (v == null) return NotFound();
        v.Key = dto.Key;
        v.Value = dto.Value;
        v.Type = dto.Type;
        v.Scope = dto.Scope;
        v.Description = dto.Description;
        await _repo.UpdateAsync(v);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _repo.DeleteAsync(id);
        return NoContent();
    }

    private static VariableDto MapDto(Variable v) => new(
        v.Id, v.Key, v.Type == "secret" ? "***" : v.Value,
        v.Type, v.Scope, v.WorkflowId, v.Description, v.CreatedAt);
}

public record VariableDto(Guid Id, string Key, string? Value, string Type, string Scope,
    Guid? WorkflowId, string? Description, DateTime CreatedAt);
public record VariableCreateDto(string Key, string? Value, string Type = "string",
    string Scope = "global", Guid? WorkflowId = null, string? Description = null);
