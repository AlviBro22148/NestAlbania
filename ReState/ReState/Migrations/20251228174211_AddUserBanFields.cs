using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReState.Migrations
{
    /// <inheritdoc />
    public partial class AddUserBanFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BanReason",
                table: "Userss",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "BannedAt",
                table: "Userss",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "BannedBy",
                table: "Userss",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsBanned",
                table: "Userss",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BanReason",
                table: "Userss");

            migrationBuilder.DropColumn(
                name: "BannedAt",
                table: "Userss");

            migrationBuilder.DropColumn(
                name: "BannedBy",
                table: "Userss");

            migrationBuilder.DropColumn(
                name: "IsBanned",
                table: "Userss");
        }
    }
}
