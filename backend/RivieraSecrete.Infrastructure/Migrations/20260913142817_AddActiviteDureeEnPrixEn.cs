using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RivieraSecrete.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddActiviteDureeEnPrixEn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DureeEn",
                table: "Activites",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PrixEn",
                table: "Activites",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DureeEn",
                table: "Activites");

            migrationBuilder.DropColumn(
                name: "PrixEn",
                table: "Activites");
        }
    }
}
