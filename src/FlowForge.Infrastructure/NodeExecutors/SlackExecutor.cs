using System.Text;
using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using Microsoft.Extensions.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace FlowForge.Infrastructure.NodeExecutors;

public class SlackExecutor : INodeExecutor
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IExpressionEvaluator _evaluator;

    public SlackExecutor(IHttpClientFactory httpClientFactory, IExpressionEvaluator evaluator)
    {
        _httpClientFactory = httpClientFactory;
        _evaluator = evaluator;
    }

    public NodeType NodeType => NodeType.Slack;

    public async Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        var results = new List<JObject>();

        foreach (var item in context.InputItems)
        {
            var channel = _evaluator.Evaluate(context.GetConfigString("channel", "#general"), item, context.ExecutionContext);
            var text = _evaluator.Evaluate(context.GetConfigString("text"), item, context.ExecutionContext);

            string? token = null;
            if (context.CredentialId.HasValue &&
                context.ExecutionContext.Credentials.TryGetValue(context.CredentialId.Value, out var cred))
                token = cred.GetValueOrDefault("token");

            if (string.IsNullOrEmpty(token))
                return new NodeExecutionResult { Success = false, ErrorMessage = "Slack token required" };

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                var payload = JsonConvert.SerializeObject(new { channel, text });
                var response = await client.PostAsync(
                    "https://slack.com/api/chat.postMessage",
                    new StringContent(payload, Encoding.UTF8, "application/json"));

                var body = await response.Content.ReadAsStringAsync();
                var parsed = JObject.Parse(body);
                results.Add(new JObject
                {
                    ["ok"] = parsed["ok"],
                    ["channel"] = channel,
                    ["ts"] = parsed["ts"]
                });
            }
            catch (Exception ex)
            {
                return new NodeExecutionResult { Success = false, ErrorMessage = ex.Message };
            }
        }
        return new NodeExecutionResult { Success = true, Items = results };
    }
}
