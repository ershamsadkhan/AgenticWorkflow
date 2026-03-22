using FlowForge.Core.Entities;

namespace FlowForge.Core.Interfaces;

public interface IVariableRepository
{
    Task<IEnumerable<Variable>> GetAllAsync(Guid userId);
    Task<Variable?> GetByIdAsync(Guid id);
    Task<Variable?> GetByKeyAsync(string key, Guid userId, Guid? workflowId = null);
    Task<Variable> CreateAsync(Variable variable);
    Task<Variable> UpdateAsync(Variable variable);
    Task DeleteAsync(Guid id);
    Task<Dictionary<string, string>> GetWorkflowVariablesAsync(Guid userId, Guid workflowId);
}
