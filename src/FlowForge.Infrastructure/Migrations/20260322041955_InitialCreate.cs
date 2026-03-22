using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlowForge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AvatarUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WorkflowTags",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Color = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowTags", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Credentials",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EncryptedData = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Credentials", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Credentials_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Workflows",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    TriggerType = table.Column<int>(type: "int", nullable: false),
                    CronExpression = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    WebhookPath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Tags = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Version = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Workflows", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Workflows_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkflowExecutions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FinishedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DurationMs = table.Column<long>(type: "bigint", nullable: true),
                    ErrorMessage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TriggerData = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ResultData = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RetryCount = table.Column<int>(type: "int", nullable: false),
                    Mode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    WorkflowId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowExecutions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkflowExecutions_Workflows_WorkflowId",
                        column: x => x.WorkflowId,
                        principalTable: "Workflows",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "WorkflowNodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Type = table.Column<int>(type: "int", nullable: false),
                    PositionX = table.Column<double>(type: "float", nullable: false),
                    PositionY = table.Column<double>(type: "float", nullable: false),
                    Configuration = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    InputSchema = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OutputSchema = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDisabled = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExecutionOrder = table.Column<int>(type: "int", nullable: false),
                    WorkflowId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CredentialId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowNodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkflowNodes_Credentials_CredentialId",
                        column: x => x.CredentialId,
                        principalTable: "Credentials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_WorkflowNodes_Workflows_WorkflowId",
                        column: x => x.WorkflowId,
                        principalTable: "Workflows",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "NodeConnections",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SourceHandle = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TargetHandle = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Condition = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    WorkflowId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SourceNodeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TargetNodeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NodeConnections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NodeConnections_WorkflowNodes_SourceNodeId",
                        column: x => x.SourceNodeId,
                        principalTable: "WorkflowNodes",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_NodeConnections_WorkflowNodes_TargetNodeId",
                        column: x => x.TargetNodeId,
                        principalTable: "WorkflowNodes",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_NodeConnections_Workflows_WorkflowId",
                        column: x => x.WorkflowId,
                        principalTable: "Workflows",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "NodeExecutions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FinishedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DurationMs = table.Column<long>(type: "bigint", nullable: true),
                    InputData = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OutputData = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ErrorMessage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RetryCount = table.Column<int>(type: "int", nullable: false),
                    WorkflowExecutionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NodeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NodeExecutions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NodeExecutions_WorkflowExecutions_WorkflowExecutionId",
                        column: x => x.WorkflowExecutionId,
                        principalTable: "WorkflowExecutions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NodeExecutions_WorkflowNodes_NodeId",
                        column: x => x.NodeId,
                        principalTable: "WorkflowNodes",
                        principalColumn: "Id");
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "AvatarUrl", "CreatedAt", "Email", "FirstName", "IsActive", "LastLoginAt", "LastName", "PasswordHash", "Role" },
                values: new object[] { new Guid("00000000-0000-0000-0000-000000000001"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin@flowforge.dev", "Admin", true, null, "User", "JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIKk=", "Admin" });

            migrationBuilder.CreateIndex(
                name: "IX_Credentials_UserId",
                table: "Credentials",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_NodeConnections_SourceNodeId",
                table: "NodeConnections",
                column: "SourceNodeId");

            migrationBuilder.CreateIndex(
                name: "IX_NodeConnections_TargetNodeId",
                table: "NodeConnections",
                column: "TargetNodeId");

            migrationBuilder.CreateIndex(
                name: "IX_NodeConnections_WorkflowId",
                table: "NodeConnections",
                column: "WorkflowId");

            migrationBuilder.CreateIndex(
                name: "IX_NodeExecutions_NodeId",
                table: "NodeExecutions",
                column: "NodeId");

            migrationBuilder.CreateIndex(
                name: "IX_NodeExecutions_WorkflowExecutionId",
                table: "NodeExecutions",
                column: "WorkflowExecutionId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowExecutions_WorkflowId",
                table: "WorkflowExecutions",
                column: "WorkflowId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowNodes_CredentialId",
                table: "WorkflowNodes",
                column: "CredentialId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowNodes_WorkflowId",
                table: "WorkflowNodes",
                column: "WorkflowId");

            migrationBuilder.CreateIndex(
                name: "IX_Workflows_UserId",
                table: "Workflows",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NodeConnections");

            migrationBuilder.DropTable(
                name: "NodeExecutions");

            migrationBuilder.DropTable(
                name: "WorkflowTags");

            migrationBuilder.DropTable(
                name: "WorkflowExecutions");

            migrationBuilder.DropTable(
                name: "WorkflowNodes");

            migrationBuilder.DropTable(
                name: "Credentials");

            migrationBuilder.DropTable(
                name: "Workflows");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
