using System.Text;
using FlowForge.Core.Interfaces;
using FlowForge.Infrastructure.Data;
using FlowForge.Infrastructure.NodeExecutors;
using FlowForge.Infrastructure.Repositories;
using FlowForge.Infrastructure.Services;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using FlowForge.Api.Hubs;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=localhost;Database=FlowForge;Trusted_Connection=True;TrustServerCertificate=True;";

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

// Hangfire
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(connectionString, new SqlServerStorageOptions
    {
        CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
        SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
        QueuePollInterval = TimeSpan.Zero,
        UseRecommendedIsolationLevel = true,
        DisableGlobalLocks = true
    }));
builder.Services.AddHangfireServer();

// SignalR
builder.Services.AddSignalR();

// HTTP Client
builder.Services.AddHttpClient("FlowForge").ConfigureHttpClient(c =>
{
    c.Timeout = TimeSpan.FromSeconds(30);
});
builder.Services.AddHttpClient(); // default

// Repositories
builder.Services.AddScoped<IWorkflowRepository, WorkflowRepository>();
builder.Services.AddScoped<ICredentialRepository, CredentialRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IVariableRepository, VariableRepository>();

// Services
var encryptionKey = builder.Configuration["Security:EncryptionKey"] ?? "FlowForge-AES-Key-2026-SuperSecret!";
builder.Services.AddSingleton<ICredentialService>(new CredentialService(encryptionKey));
builder.Services.AddScoped<IExpressionEvaluator, ExpressionEvaluator>();
builder.Services.AddScoped<IExecutionEngine, ExecutionEngine>();
builder.Services.AddScoped<ISchedulerService, SchedulerService>();

// Node Executors
builder.Services.AddScoped<INodeExecutor, ManualTriggerExecutor>();
builder.Services.AddScoped<INodeExecutor, WebhookTriggerExecutor>();
builder.Services.AddScoped<INodeExecutor, ScheduleTriggerExecutor>();
builder.Services.AddScoped<INodeExecutor, ChatMessageTriggerExecutor>();
builder.Services.AddScoped<INodeExecutor, HttpRequestExecutor>();
builder.Services.AddScoped<INodeExecutor, SetExecutor>();
builder.Services.AddScoped<INodeExecutor, FilterExecutor>();
builder.Services.AddScoped<INodeExecutor, IfConditionExecutor>();
builder.Services.AddScoped<INodeExecutor, SwitchExecutor>();
builder.Services.AddScoped<INodeExecutor, LoopExecutor>();
builder.Services.AddScoped<INodeExecutor, MergeExecutor>();
builder.Services.AddScoped<INodeExecutor, SplitExecutor>();
builder.Services.AddScoped<INodeExecutor, DelayExecutor>();
builder.Services.AddScoped<INodeExecutor, TransformExecutor>();
builder.Services.AddScoped<INodeExecutor, EmailExecutor>();
builder.Services.AddScoped<INodeExecutor, SqlQueryExecutor>();
builder.Services.AddScoped<INodeExecutor, SlackExecutor>();
builder.Services.AddScoped<INodeExecutor, AiChatExecutor>();
builder.Services.AddScoped<INodeExecutor, AiAgentExecutor>();
builder.Services.AddScoped<INodeExecutor, TextSummarizerExecutor>();
builder.Services.AddScoped<INodeExecutor, SubWorkflowExecutor>();

// JWT
var jwtKey = builder.Configuration["Jwt:Key"] ?? "FlowForge-Super-Secret-Key-2026-Must-Be-Long-Enough!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "FlowForge",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "FlowForge",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
        // Allow SignalR token from query string
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var token = ctx.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token) && ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                    ctx.Token = token;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Angular", policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials());
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Auto-migrate
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    // Reschedule all active scheduled workflows
    var scheduler = scope.ServiceProvider.GetRequiredService<ISchedulerService>();
    await scheduler.RescheduleAllAsync();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Angular");
app.UseAuthentication();
app.UseAuthorization();

app.UseHangfireDashboard("/hangfire");
app.MapControllers();
app.MapHub<ExecutionHub>("/hubs/execution");

app.Run();
