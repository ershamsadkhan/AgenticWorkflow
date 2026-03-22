using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using Microsoft.Data.SqlClient;
using Newtonsoft.Json.Linq;

namespace FlowForge.Infrastructure.NodeExecutors;

public class SqlQueryExecutor : INodeExecutor
{
    private readonly IExpressionEvaluator _evaluator;
    public SqlQueryExecutor(IExpressionEvaluator evaluator) => _evaluator = evaluator;
    public NodeType NodeType => NodeType.SqlQuery;

    public async Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        var query = _evaluator.Evaluate(context.GetConfigString("query"), null, context.ExecutionContext);
        var operation = context.GetConfigString("operation", "select");

        string connectionString;
        if (context.CredentialId.HasValue &&
            context.ExecutionContext.Credentials.TryGetValue(context.CredentialId.Value, out var cred))
        {
            connectionString = cred.GetValueOrDefault("connectionString", "");
        }
        else
        {
            return new NodeExecutionResult { Success = false, ErrorMessage = "SQL credential required" };
        }

        try
        {
            await using var conn = new SqlConnection(connectionString);
            await conn.OpenAsync();
            await using var cmd = new SqlCommand(query, conn);

            if (operation == "select")
            {
                var results = new List<JObject>();
                await using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var row = new JObject();
                    for (int i = 0; i < reader.FieldCount; i++)
                        row[reader.GetName(i)] = reader.IsDBNull(i) ? null : JToken.FromObject(reader.GetValue(i));
                    results.Add(row);
                }
                return new NodeExecutionResult { Success = true, Items = results };
            }
            else
            {
                var affected = await cmd.ExecuteNonQueryAsync();
                return new NodeExecutionResult
                {
                    Success = true,
                    Items = new() { new JObject { ["rowsAffected"] = affected } }
                };
            }
        }
        catch (Exception ex)
        {
            return new NodeExecutionResult { Success = false, ErrorMessage = ex.Message };
        }
    }
}
