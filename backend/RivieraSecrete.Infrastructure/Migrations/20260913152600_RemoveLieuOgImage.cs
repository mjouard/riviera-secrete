using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RivieraSecrete.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveLieuOgImage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OgImage",
                table: "Lieux");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OgImage",
                table: "Lieux",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
