using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ReState.Migrations
{
    /// <inheritdoc />
    public partial class SimplifyChatConversation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsArchivedByAgent",
                table: "ChatConversations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchivedByUser",
                table: "ChatConversations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeletedByAgent",
                table: "ChatConversations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeletedByUser",
                table: "ChatConversations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "TestimonialLikes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TestimonialId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TestimonialLikes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TestimonialLikes_Testimonials_TestimonialId",
                        column: x => x.TestimonialId,
                        principalTable: "Testimonials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TestimonialLikes_Userss_UserId",
                        column: x => x.UserId,
                        principalTable: "Userss",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TestimonialLikes_TestimonialId_UserId",
                table: "TestimonialLikes",
                columns: new[] { "TestimonialId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TestimonialLikes_UserId",
                table: "TestimonialLikes",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TestimonialLikes");

            migrationBuilder.DropColumn(
                name: "IsArchivedByAgent",
                table: "ChatConversations");

            migrationBuilder.DropColumn(
                name: "IsArchivedByUser",
                table: "ChatConversations");

            migrationBuilder.DropColumn(
                name: "IsDeletedByAgent",
                table: "ChatConversations");

            migrationBuilder.DropColumn(
                name: "IsDeletedByUser",
                table: "ChatConversations");
        }
    }
}
