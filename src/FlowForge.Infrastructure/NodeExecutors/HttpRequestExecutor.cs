using System.Text;
using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using Microsoft.Extensions.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace FlowForge.Infrastructure.NodeExecutors;

public class HttpRequestExecutor : INodeExecutor
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IExpressionEvaluator _evaluator;

    public HttpRequestExecutor(IHttpClientFactory httpClientFactory, IExpressionEvaluator evaluator)
    {
        _httpClientFactory = httpClientFactory;
        _evaluator = evaluator;
    }

    public NodeType NodeType => NodeType.HttpRequest;

    public async Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        var results = new List<JObject>();

        foreach (var item in context.InputItems.DefaultIfEmpty(new JObject()))
        {
            var url = _evaluator.Evaluate(context.GetConfigString("url"), item, context.ExecutionContext);
            var method = context.GetConfigString("method", "GET").ToUpperInvariant();
            var headersJson = context.GetConfigString("headers", "{}");
            var bodyStr = context.GetConfigString("body", "");
            var authType = context.GetConfigString("authType", "none");

            if (string.IsNullOrWhiteSpace(url))
            {
                return new NodeExecutionResult { Success = false, ErrorMessage = "URL is required" };
            }

            try
            {
                var client = _httpClientFactory.CreateClient("FlowForge");
                var request = new HttpRequestMessage(new HttpMethod(method), url);

                // Apply headers
                var headers = JObject.Parse(string.IsNullOrEmpty(headersJson) ? "{}" : headersJson);
                foreach (var prop in headers.Properties())
                    request.Headers.TryAddWithoutValidation(prop.Name, prop.Value.ToString());

                // Apply auth from credential
                if (authType == "bearer" && context.CredentialId.HasValue &&
                    context.ExecutionContext.Credentials.TryGetValue(context.CredentialId.Value, out var cred))
                {
                    request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue(
                        "Bearer", cred.GetValueOrDefault("token", ""));
                }
                else if (authType == "basic" && context.CredentialId.HasValue &&
                    context.ExecutionContext.Credentials.TryGetValue(context.CredentialId.Value, out var basicCred))
                {
                    var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes(
                        $"{basicCred.GetValueOrDefault("username")}:{basicCred.GetValueOrDefault("password")}"));
                    request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", credentials);
                }

                // Apply body
                if (!string.IsNullOrEmpty(bodyStr) && method != "GET" && method != "HEAD")
                {
                    var evaluatedBody = _evaluator.Evaluate(bodyStr, item, context.ExecutionContext);
                    request.Content = new StringContent(evaluatedBody, Encoding.UTF8, "application/json");
                }

                var response = await client.SendAsync(request);
                var responseBody = await response.Content.ReadAsStringAsync();

                var result = new JObject
                {
                    ["statusCode"] = (int)response.StatusCode,
                    ["statusText"] = response.StatusCode.ToString(),
                    ["ok"] = response.IsSuccessStatusCode,
                    ["url"] = url
                };

                try
                {
                    result["body"] = JToken.Parse(responseBody);
                }
                catch
                {
                    result["body"] = responseBody;
                }

                // Add headers
                var respHeaders = new JObject();
                foreach (var h in response.Headers)
                    respHeaders[h.Key] = string.Join(", ", h.Value);
                result["headers"] = respHeaders;

                results.Add(result);
            }
            catch (Exception ex)
            {
                return new NodeExecutionResult { Success = false, ErrorMessage = ex.Message };
            }
        }

        return new NodeExecutionResult { Success = true, Items = results };
    }
}
