using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReState.Migrations
{
    /// <inheritdoc />
    public partial class AddGreenHomesFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasDoubleGlazedWindows",
                table: "Properties",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasEnergyEfficientAppliances",
                table: "Properties",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasEnergyStarCertification",
                table: "Properties",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasGreenRoof",
                table: "Properties",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasLEDLighting",
                table: "Properties",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasLEEDCertification",
                table: "Properties",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasRainwaterHarvesting",
                table: "Properties",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasSmartThermostats",
                table: "Properties",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasSolarPanels",
                table: "Properties",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "LEEDLevel",
                table: "Properties",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HasDoubleGlazedWindows",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "HasEnergyEfficientAppliances",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "HasEnergyStarCertification",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "HasGreenRoof",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "HasLEDLighting",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "HasLEEDCertification",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "HasRainwaterHarvesting",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "HasSmartThermostats",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "HasSolarPanels",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "LEEDLevel",
                table: "Properties");
        }
    }
}
