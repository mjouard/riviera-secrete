using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RivieraSecrete.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddActiviteHoraires : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // EF génère `defaultValue: ""` pour une colonne jsonb non nullable, or une chaîne
            // vide n'est pas du JSON valide : Postgres rejette l'ALTER TABLE. Corrigé en "[]",
            // qui est aussi la valeur attendue par le converter (liste vide).
            migrationBuilder.AddColumn<string>(
                name: "FermeJours",
                table: "Activites",
                type: "jsonb",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "Horaires",
                table: "Activites",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HorairesEn",
                table: "Activites",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FermeJours",
                table: "Activites");

            migrationBuilder.DropColumn(
                name: "Horaires",
                table: "Activites");

            migrationBuilder.DropColumn(
                name: "HorairesEn",
                table: "Activites");
        }
    }
}
