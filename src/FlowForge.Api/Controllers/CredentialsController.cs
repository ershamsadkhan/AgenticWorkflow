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
public class CredentialsController : ControllerBase
{
    private readonly ICredentialRepository _repo;

    public CredentialsController(ICredentialRepository repo) => _repo = repo;

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CredentialDto>>> GetAll()
    {
        var creds = await _repo.GetAllAsync(UserId);
        return Ok(creds.Select(c => new CredentialDto(c.Id, c.Name, c.Type, c.CreatedAt, c.UpdatedAt)));
    }

    [HttpPost]
    public async Task<ActionResult<CredentialDto>> Create(CredentialCreateDto dto)
    {
        var credential = new Credential
        {
            Name = dto.Name,
            Type = dto.Type,
            EncryptedData = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(dto.Data)),
            UserId = UserId
        };

        var created = await _repo.CreateAsync(credential);
        return Ok(new CredentialDto(created.Id, created.Name, created.Type, created.CreatedAt, created.UpdatedAt));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        await _repo.DeleteAsync(id);
        return NoContent();
    }
}
