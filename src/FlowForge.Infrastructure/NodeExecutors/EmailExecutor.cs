using System.Net;
using System.Net.Mail;
using FlowForge.Core.Enums;
using FlowForge.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;

namespace FlowForge.Infrastructure.NodeExecutors;

public class EmailExecutor : INodeExecutor
{
    private readonly IConfiguration _config;
    private readonly IExpressionEvaluator _evaluator;

    public EmailExecutor(IConfiguration config, IExpressionEvaluator evaluator)
    {
        _config = config;
        _evaluator = evaluator;
    }

    public NodeType NodeType => NodeType.Email;

    public async Task<NodeExecutionResult> ExecuteAsync(WorkflowNodeContext context)
    {
        var results = new List<JObject>();
        foreach (var item in context.InputItems)
        {
            var to = _evaluator.Evaluate(context.GetConfigString("to"), item, context.ExecutionContext);
            var subject = _evaluator.Evaluate(context.GetConfigString("subject"), item, context.ExecutionContext);
            var body = _evaluator.Evaluate(context.GetConfigString("body"), item, context.ExecutionContext);
            var isHtml = context.GetConfig<bool>("isHtml", true);

            // Get SMTP settings - from credential or config
            string host, username, password;
            int port;

            if (context.CredentialId.HasValue &&
                context.ExecutionContext.Credentials.TryGetValue(context.CredentialId.Value, out var cred))
            {
                host = cred.GetValueOrDefault("host", "");
                port = int.TryParse(cred.GetValueOrDefault("port", "587"), out var p) ? p : 587;
                username = cred.GetValueOrDefault("username", "");
                password = cred.GetValueOrDefault("password", "");
            }
            else
            {
                host = _config["Email:Host"] ?? "localhost";
                port = int.TryParse(_config["Email:Port"], out var p) ? p : 587;
                username = _config["Email:Username"] ?? "";
                password = _config["Email:Password"] ?? "";
            }

            try
            {
                using var client = new SmtpClient(host, port)
                {
                    EnableSsl = true,
                    Credentials = new NetworkCredential(username, password)
                };
                var from = _config["Email:From"] ?? username;
                await client.SendMailAsync(new MailMessage(from, to, subject, body) { IsBodyHtml = isHtml });

                results.Add(new JObject
                {
                    ["sent"] = true,
                    ["to"] = to,
                    ["subject"] = subject
                });
            }
            catch (Exception ex)
            {
                return new NodeExecutionResult { Success = false, ErrorMessage = $"Email failed: {ex.Message}" };
            }
        }
        return new NodeExecutionResult { Success = true, Items = results };
    }
}
