using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RivieraSecrete.Domain.Entities;

namespace RivieraSecrete.Infrastructure.Data.Configurations;

public class LieuConfiguration : IEntityTypeConfiguration<Lieu>
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public void Configure(EntityTypeBuilder<Lieu> builder)
    {
        builder.HasKey(l => l.Id);
        builder.HasIndex(l => l.Slug).IsUnique();
        builder.Property(l => l.Slug).HasMaxLength(100).IsRequired();
        builder.Property(l => l.Nom).HasMaxLength(200).IsRequired();

        builder.HasOne(l => l.Ville)
               .WithMany(v => v.Lieux)
               .HasForeignKey(l => l.VilleSlug)
               .HasPrincipalKey(v => v.Slug)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(l => l.Activites)
               .WithOne(a => a.Lieu)
               .HasForeignKey(a => a.LieuId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.Property(l => l.Badges)
               .HasColumnType("jsonb")
               .HasConversion(
                   v => JsonSerializer.Serialize(v, Json),
                   v => JsonSerializer.Deserialize<List<string>>(v, Json) ?? new List<string>());

        builder.Property(l => l.MetaPills)
               .HasColumnType("jsonb")
               .HasConversion(
                   v => JsonSerializer.Serialize(v, Json),
                   v => JsonSerializer.Deserialize<List<MetaPill>>(v, Json) ?? new List<MetaPill>());

        builder.Property(l => l.Tips)
               .HasColumnType("jsonb")
               .HasConversion(
                   v => JsonSerializer.Serialize(v, Json),
                   v => JsonSerializer.Deserialize<List<Tip>>(v, Json) ?? new List<Tip>());

        builder.Property(l => l.Related)
               .HasColumnType("jsonb")
               .HasConversion(
                   v => JsonSerializer.Serialize(v, Json),
                   v => JsonSerializer.Deserialize<List<RelatedCard>>(v, Json) ?? new List<RelatedCard>());
    }
}
