using FlowForge.Core.Enums;

namespace FlowForge.Api.DTOs;

public record WorkflowListDto(
    Guid Id, string Name, string? Description, WorkflowStatus Status,
    TriggerType TriggerType, string? Tags, int NodeCount, int ExecutionCount,
    DateTime CreatedAt, DateTime UpdatedAt);

public record WorkflowDetailDto(
    Guid Id, string Name, string? Description, WorkflowStatus Status,
    TriggerType TriggerType, string? CronExpression, string? WebhookPath,
    string? Tags, int Version, DateTime CreatedAt, DateTime UpdatedAt,
    List<WorkflowNodeDto> Nodes, List<NodeConnectionDto> Connections);

public record WorkflowCreateDto(
    string Name, string? Description, TriggerType TriggerType,
    string? CronExpression, string? Tags,
    List<WorkflowNodeDto>? Nodes, List<NodeConnectionDto>? Connections);

public record WorkflowUpdateDto(
    string Name, string? Description, WorkflowStatus Status,
    TriggerType TriggerType, string? CronExpression, string? Tags,
    List<WorkflowNodeDto> Nodes, List<NodeConnectionDto> Connections);

public record WorkflowNodeDto(
    Guid Id, string Name, string? Label, NodeType Type,
    double PositionX, double PositionY, string? Configuration,
    bool IsDisabled, string? Notes, int ExecutionOrder, Guid? CredentialId);

public record NodeConnectionDto(
    Guid Id, Guid SourceNodeId, Guid TargetNodeId,
    string SourceHandle, string TargetHandle, string? Label, string? Condition);

public record ExecutionDto(
    Guid Id, Guid WorkflowId, string WorkflowName, ExecutionStatus Status,
    DateTime StartedAt, DateTime? FinishedAt, long? DurationMs,
    string? ErrorMessage, string Mode, List<NodeExecutionDto>? NodeExecutions);

public record NodeExecutionDto(
    Guid Id, Guid NodeId, string NodeName, ExecutionStatus Status,
    DateTime StartedAt, DateTime? FinishedAt, long? DurationMs,
    string? InputData, string? OutputData, string? ErrorMessage);

public record CredentialDto(Guid Id, string Name, string Type, DateTime CreatedAt, DateTime UpdatedAt);
public record CredentialCreateDto(string Name, string Type, string Data);
