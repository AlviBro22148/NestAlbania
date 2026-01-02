using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReState.Migrations
{
    /// <inheritdoc />
    public partial class COnfigurePostLikeRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CommunityPostId",
                table: "PostLikes",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PostLikes_CommunityPostId",
                table: "PostLikes",
                column: "CommunityPostId");

            migrationBuilder.AddForeignKey(
                name: "FK_PostLikes_CommunityPosts_CommunityPostId",
                table: "PostLikes",
                column: "CommunityPostId",
                principalTable: "CommunityPosts",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PostLikes_CommunityPosts_CommunityPostId",
                table: "PostLikes");

            migrationBuilder.DropIndex(
                name: "IX_PostLikes_CommunityPostId",
                table: "PostLikes");

            migrationBuilder.DropColumn(
                name: "CommunityPostId",
                table: "PostLikes");
        }
    }
}
