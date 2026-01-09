using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReState.Migrations
{
    /// <inheritdoc />
    public partial class AddCityDropdown : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Userss",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "City",
                table: "Userss");
        }
    }
}
