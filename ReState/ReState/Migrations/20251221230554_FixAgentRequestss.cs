using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReState.Migrations
{
    /// <inheritdoc />
    public partial class FixAgentRequestss : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_AgentRequests_RequestedAt",
                table: "AgentRequests",
                column: "RequestedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AgentRequests_Status",
                table: "AgentRequests",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AgentRequests_RequestedAt",
                table: "AgentRequests");

            migrationBuilder.DropIndex(
                name: "IX_AgentRequests_Status",
                table: "AgentRequests");
        }
    }
}
