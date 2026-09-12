using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RivieraSecrete.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEnglishTranslationColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DescriptionEn",
                table: "Villes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NomEn",
                table: "Villes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description2En",
                table: "Lieux",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionEn",
                table: "Lieux",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NomEn",
                table: "Lieux",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BadgeEn",
                table: "Itineraires",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionEn",
                table: "Itineraires",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IntroEn",
                table: "Itineraires",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MapLabelEn",
                table: "Itineraires",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TitreEn",
                table: "Itineraires",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AltEn",
                table: "Activites",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NomEn",
                table: "Activites",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DescriptionEn",
                table: "Villes");

            migrationBuilder.DropColumn(
                name: "NomEn",
                table: "Villes");

            migrationBuilder.DropColumn(
                name: "Description2En",
                table: "Lieux");

            migrationBuilder.DropColumn(
                name: "DescriptionEn",
                table: "Lieux");

            migrationBuilder.DropColumn(
                name: "NomEn",
                table: "Lieux");

            migrationBuilder.DropColumn(
                name: "BadgeEn",
                table: "Itineraires");

            migrationBuilder.DropColumn(
                name: "DescriptionEn",
                table: "Itineraires");

            migrationBuilder.DropColumn(
                name: "IntroEn",
                table: "Itineraires");

            migrationBuilder.DropColumn(
                name: "MapLabelEn",
                table: "Itineraires");

            migrationBuilder.DropColumn(
                name: "TitreEn",
                table: "Itineraires");

            migrationBuilder.DropColumn(
                name: "AltEn",
                table: "Activites");

            migrationBuilder.DropColumn(
                name: "NomEn",
                table: "Activites");
        }
    }
}
