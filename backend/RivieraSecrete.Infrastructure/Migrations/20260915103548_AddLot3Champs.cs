using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RivieraSecrete.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLot3Champs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "LinkText",
                table: "Activites",
                newName: "LienType");

            // defaultValue: "" (chaîne vide) se traduit par le provider Npgsql en
            // DEFAULT '{}' pour une colonne jsonb — un objet JSON vide, pas un tableau vide,
            // ce qui casse la désérialisation en List<string> (trouvé en l'appliquant en
            // prod : la première lecture d'un Lieu pas encore rafraîchi levait une
            // JsonException). defaultValueSql explicite pour obtenir un vrai '[]'.
            migrationBuilder.AddColumn<string>(
                name: "Tags",
                table: "Lieux",
                type: "jsonb",
                nullable: false,
                defaultValueSql: "'[]'");

            migrationBuilder.AddColumn<string>(
                name: "CommuneSlug",
                table: "Activites",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "Partenaire",
                table: "Activites",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SurPlace",
                table: "Activites",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Tags",
                table: "Lieux");

            migrationBuilder.DropColumn(
                name: "CommuneSlug",
                table: "Activites");

            migrationBuilder.DropColumn(
                name: "Partenaire",
                table: "Activites");

            migrationBuilder.DropColumn(
                name: "SurPlace",
                table: "Activites");

            migrationBuilder.RenameColumn(
                name: "LienType",
                table: "Activites",
                newName: "LinkText");
        }
    }
}
