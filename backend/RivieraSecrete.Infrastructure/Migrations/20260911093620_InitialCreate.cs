using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace RivieraSecrete.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Itineraires",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Titre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Badge = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Intro = table.Column<string>(type: "text", nullable: false),
                    HeroImgTag = table.Column<string>(type: "text", nullable: false),
                    MapLabel = table.Column<string>(type: "text", nullable: false),
                    MetaPills = table.Column<string>(type: "jsonb", nullable: false),
                    Items = table.Column<string>(type: "jsonb", nullable: false),
                    Booking = table.Column<string>(type: "jsonb", nullable: false),
                    Suggestions = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Itineraires", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Villes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Nom = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    RegionSlug = table.Column<string>(type: "text", nullable: false),
                    RegionLabel = table.Column<string>(type: "text", nullable: false),
                    Lat = table.Column<double>(type: "double precision", nullable: false),
                    Lng = table.Column<double>(type: "double precision", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    ThumbImage = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Villes", x => x.Id);
                    table.UniqueConstraint("AK_Villes_Slug", x => x.Slug);
                });

            migrationBuilder.CreateTable(
                name: "Lieux",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Nom = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Description2 = table.Column<string>(type: "text", nullable: true),
                    Commune = table.Column<string>(type: "text", nullable: false),
                    RegionSlug = table.Column<string>(type: "text", nullable: false),
                    RegionLabel = table.Column<string>(type: "text", nullable: false),
                    VilleSlug = table.Column<string>(type: "character varying(100)", nullable: false),
                    Lat = table.Column<double>(type: "double precision", nullable: false),
                    Lng = table.Column<double>(type: "double precision", nullable: false),
                    HeroImage = table.Column<string>(type: "text", nullable: false),
                    HeroAlt = table.Column<string>(type: "text", nullable: false),
                    HeroSlides = table.Column<int>(type: "integer", nullable: true),
                    ThumbImage = table.Column<string>(type: "text", nullable: false),
                    OgImage = table.Column<string>(type: "text", nullable: false),
                    Badges = table.Column<string>(type: "jsonb", nullable: false),
                    MetaPills = table.Column<string>(type: "jsonb", nullable: false),
                    Tips = table.Column<string>(type: "jsonb", nullable: false),
                    Related = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Lieux", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Lieux_Villes_VilleSlug",
                        column: x => x.VilleSlug,
                        principalTable: "Villes",
                        principalColumn: "Slug",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Activites",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ActiviteId = table.Column<string>(type: "text", nullable: false),
                    Nom = table.Column<string>(type: "text", nullable: false),
                    Badge = table.Column<string>(type: "text", nullable: false),
                    Duree = table.Column<string>(type: "text", nullable: false),
                    Prix = table.Column<string>(type: "text", nullable: false),
                    Url = table.Column<string>(type: "text", nullable: false),
                    Image = table.Column<string>(type: "text", nullable: false),
                    Alt = table.Column<string>(type: "text", nullable: false),
                    LinkText = table.Column<string>(type: "text", nullable: false),
                    LieuId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Activites", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Activites_Lieux_LieuId",
                        column: x => x.LieuId,
                        principalTable: "Lieux",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Activites_LieuId",
                table: "Activites",
                column: "LieuId");

            migrationBuilder.CreateIndex(
                name: "IX_Itineraires_Slug",
                table: "Itineraires",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Lieux_Slug",
                table: "Lieux",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Lieux_VilleSlug",
                table: "Lieux",
                column: "VilleSlug");

            migrationBuilder.CreateIndex(
                name: "IX_Villes_Slug",
                table: "Villes",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Activites");

            migrationBuilder.DropTable(
                name: "Itineraires");

            migrationBuilder.DropTable(
                name: "Lieux");

            migrationBuilder.DropTable(
                name: "Villes");
        }
    }
}
