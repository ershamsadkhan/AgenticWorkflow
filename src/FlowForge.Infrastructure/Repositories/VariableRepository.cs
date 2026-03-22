using FlowForge.Core.Entities;
using FlowForge.Core.Interfaces;
using FlowForge.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FlowForge.Infrastructure.Repositories;

public class VariableRepository : IVariableRepository
{
    private readonly AppDbContext _db;
    public VariableRepository(AppDbContext db) => _db = db;

    public async Task<IEnumerable<Variable>> GetAllAsync(Guid userId) =>
        await _db.Variables.AsNoTracking()
            .Where(v => v.UserId == userId)
            .OrderBy(v => v.Key)
            .ToListAsync();

    public async Task<Variable?> GetByIdAsync(Guid id) =>
        await _db.Variables.FirstOrDefaultAsync(v => v.Id == id);

    public async Task<Variable?> GetByKeyAsync(string key, Guid userId, Guid? workflowId = null) =>
        await _db.Variables.FirstOrDefaultAsync(v =>
            v.UserId == userId && v.Key == key &&
            (workflowId == null ? v.Scope == "global" : v.WorkflowId == workflowId || v.Scope == "global"));

    public async Task<Variable> CreateAsync(Variable variable)
    {
        _db.Variables.Add(variable);
        await _db.SaveChangesAsync();
        return variable;
    }

    public async Task<Variable> UpdateAsync(Variable variable)
    {
        variable.UpdatedAt = DateTime.UtcNow;
        _db.Variables.Update(variable);
        await _db.SaveChangesAsync();
        return variable;
    }

    public async Task DeleteAsync(Guid id)
    {
        await _db.Variables.Where(v => v.Id == id).ExecuteDeleteAsync();
    }

    public async Task<Dictionary<string, string>> GetWorkflowVariablesAsync(Guid userId, Guid workflowId)
    {
        var vars = await _db.Variables.AsNoTracking()
            .Where(v => v.UserId == userId && (v.Scope == "global" || v.WorkflowId == workflowId))
            .ToListAsync();
        return vars.ToDictionary(v => v.Key, v => v.Value ?? "");
    }
}
