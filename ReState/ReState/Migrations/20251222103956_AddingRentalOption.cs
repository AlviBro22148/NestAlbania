using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReState.Migrations
{
    /// <inheritdoc />
    public partial class AddingRentalOption : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "LotSize",
                table: "Properties",
                type: "numeric(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FurnishedStatus",
                table: "Properties",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "LeaseTermMonths",
                table: "Properties",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MonthlyRent",
                table: "Properties",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SecurityDeposit",
                table: "Properties",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "UtilitiesIncluded",
                table: "Properties",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FurnishedStatus",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "LeaseTermMonths",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "MonthlyRent",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "SecurityDeposit",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "UtilitiesIncluded",
                table: "Properties");

            migrationBuilder.AlterColumn<decimal>(
                name: "LotSize",
                table: "Properties",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldNullable: true);
        }
    }
}
