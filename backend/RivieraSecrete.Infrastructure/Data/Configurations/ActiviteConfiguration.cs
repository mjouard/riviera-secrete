using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RivieraSecrete.Domain.Entities;

namespace RivieraSecrete.Infrastructure.Data.Configurations;

/// <summary>
/// Les relations d'Activite sont déclarées côté <see cref="LieuConfiguration"/> ; cette
/// configuration n'existe que pour la colonne jsonb FermeJours, même motif que
/// Lieu.Badges (liste courte, en lecture seule, aucun besoin de requête relationnelle).
/// </summary>
public class ActiviteConfiguration : IEntityTypeConfiguration<Activite>
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public void Configure(EntityTypeBuilder<Activite> builder)
    {
        builder.Property(a => a.FermeJours)
               .HasColumnType("jsonb")
               .HasConversion(
                   v => JsonSerializer.Serialize(v, Json),
                   v => JsonSerializer.Deserialize<List<int>>(v, Json) ?? new List<int>());
    }
}
