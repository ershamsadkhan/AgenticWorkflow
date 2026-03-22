using FlowForge.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;

namespace FlowForge.Api.Controllers;

[ApiController]
[Route("webhook")]
public class WebhookController : ControllerBase
{
    private readonly IExecutionEngine _engine;
    private readonly ILogger<WebhookController> _logger;

    public WebhookController(IExecutionEngine engine, ILogger<WebhookController> logger)
    {
        _engine = engine;
        _logger = logger;
    }

    [HttpPost("{*path}")]
    [HttpGet("{*path}")]
    [HttpPut("{*path}")]
    [HttpDelete("{*path}")]
    public async Task<IActionResult> HandleWebhook(string path)
    {
        try
        {
            var webhookPath = $"/webhook/{path}";
            var requestData = new JObject
            {
                ["method"] = Request.Method,
                ["path"] = Request.Path.Value,
                ["headers"] = JObject.FromObject(
                    Request.Headers.ToDictionary(h => h.Key, h => (object)h.Value.ToString())),
                ["query"] = JObject.FromObject(
                    Request.Query.ToDictionary(q => q.Key, q => (object)q.Value.ToString())),
            };

            if (Request.ContentLength > 0 && Request.Body != null)
            {
                using var reader = new StreamReader(Request.Body);
                var body = await reader.ReadToEndAsync();
                try { requestData["body"] = JToken.Parse(body); }
                catch { requestData["body"] = body; }
            }

            var execution = await _engine.ExecuteByWebhookAsync(webhookPath, requestData);

            return Ok(new
            {
                executionId = execution.Id,
                status = execution.Status.ToString(),
                message = "Workflow triggered successfully"
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Webhook {Path} not found: {Message}", path, ex.Message);
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Webhook {Path} error", path);
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
