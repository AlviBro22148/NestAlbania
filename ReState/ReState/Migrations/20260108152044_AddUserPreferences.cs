using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ReState.Migrations
{
    /// <inheritdoc />
    public partial class AddUserPreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserPreferences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    PreferredPropertyTypes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    MinBedrooms = table.Column<int>(type: "integer", nullable: true),
                    MaxBedrooms = table.Column<int>(type: "integer", nullable: true),
                    MinBathrooms = table.Column<int>(type: "integer", nullable: true),
                    MaxBathrooms = table.Column<int>(type: "integer", nullable: true),
                    MinPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    MaxPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    MinArea = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    MaxArea = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    PreferredCities = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ListingType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    WantsGarage = table.Column<bool>(type: "boolean", nullable: true),
                    WantsPetFriendly = table.Column<bool>(type: "boolean", nullable: true),
                    WantsPool = table.Column<bool>(type: "boolean", nullable: true),
                    WantsGym = table.Column<bool>(type: "boolean", nullable: true),
                    WantsAirConditioning = table.Column<bool>(type: "boolean", nullable: true),
                    PrefersGreenHomes = table.Column<bool>(type: "boolean", nullable: true),
                    MinEcoScore = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPreferences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserPreferences_Userss_UserId",
                        column: x => x.UserId,
                        principalTable: "Userss",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserPreferences_UserId",
                table: "UserPreferences",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserPreferences");
        }
    }
}
