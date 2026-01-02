using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReState.Migrations
{
    /// <inheritdoc />
    public partial class AddingFilters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Properties",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "PropertyType",
                table: "Properties",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Properties",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "HasAirConditioning",
                table: "Properties",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasGarage",
                table: "Properties",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasGym",
                table: "Properties",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasInUnitLaundry",
                table: "Properties",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasPool",
                table: "Properties",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPetFriendly",
                table: "Properties",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ListingType",
                table: "Properties",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "LotSize",
                table: "Properties",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Neighborhood",
                table: "Properties",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "ParkingSpaces",
                table: "Properties",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "YearBuilt",
                table: "Properties",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZipCode",
                table: "Properties",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "City",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "HasAirConditioning",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "HasGarage",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "HasGym",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "HasInUnitLaundry",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "HasPool",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "IsPetFriendly",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "ListingType",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "LotSize",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "Neighborhood",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "ParkingSpaces",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "YearBuilt",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "ZipCode",
                table: "Properties");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Properties",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "PropertyType",
                table: "Properties",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);
        }
    }
}
