using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RivieraSecrete.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddItinerairesComposes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ItinerairesComposes",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    EditToken = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Jours = table.Column<string>(type: "jsonb", nullable: false),
                    Nom = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DureeKey = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    VisibiliteLien = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "lien"),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItinerairesComposes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItinerairesComposes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ItinerairesComposes_UserId",
                table: "ItinerairesComposes",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ItinerairesComposes");
        }
    }
}
