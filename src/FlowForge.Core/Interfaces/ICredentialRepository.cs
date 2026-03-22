using FlowForge.Core.Entities;

namespace FlowForge.Core.Interfaces;

public interface ICredentialRepository
{
    Task<IEnumerable<Credential>> GetAllAsync(Guid userId);
    Task<Credential?> GetByIdAsync(Guid id);
    Task<Credential> CreateAsync(Credential credential);
    Task<Credential> UpdateAsync(Credential credential);
    Task DeleteAsync(Guid id);
}
