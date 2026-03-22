using FlowForge.Core.Entities;
using FlowForge.Core.Interfaces;
using FlowForge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FlowForge.Infrastructure.Repositories;

public class CredentialRepository : ICredentialRepository
{
    private readonly AppDbContext _db;

    public CredentialRepository(AppDbContext db) => _db = db;

    public async Task<IEnumerable<Credential>> GetAllAsync(Guid userId)
    {
        return await _db.Credentials
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync();
    }

    public async Task<Credential?> GetByIdAsync(Guid id)
    {
        return await _db.Credentials.FindAsync(id);
    }

    public async Task<Credential> CreateAsync(Credential credential)
    {
        _db.Credentials.Add(credential);
        await _db.SaveChangesAsync();
        return credential;
    }

    public async Task<Credential> UpdateAsync(Credential credential)
    {
        credential.UpdatedAt = DateTime.UtcNow;
        _db.Credentials.Update(credential);
        await _db.SaveChangesAsync();
        return credential;
    }

    public async Task DeleteAsync(Guid id)
    {
        var credential = await _db.Credentials.FindAsync(id);
        if (credential != null)
        {
            _db.Credentials.Remove(credential);
            await _db.SaveChangesAsync();
        }
    }
}
