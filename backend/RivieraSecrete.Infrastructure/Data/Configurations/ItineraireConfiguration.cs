using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RivieraSecrete.Domain.Entities;

namespace RivieraSecrete.Infrastructure.Data.Configurations;

public class ItineraireConfiguration : IEntityTypeConfiguration<Itineraire>
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public void Configure(EntityTypeBuilder<Itineraire> builder)
    {
        builder.HasKey(i => i.Id);
        builder.HasIndex(i => i.Slug).IsUnique();
        builder.Property(i => i.Slug).HasMaxLength(100).IsRequired();
        builder.Property(i => i.Titre).HasMaxLength(200).IsRequired();

        builder.Property(i => i.MetaPills)
               .HasColumnType("jsonb")
               .HasConversion(
                   v => JsonSerializer.Serialize(v, Json),
                   v => JsonSerializer.Deserialize<List<MetaPill>>(v, Json) ?? new List<MetaPill>());

        builder.Property(i => i.Items)
               .HasColumnType("jsonb")
               .HasConversion(
                   v => JsonSerializer.Serialize(v, Json),
                   v => JsonSerializer.Deserialize<List<ItineraireItem>>(v, Json) ?? new List<ItineraireItem>());

        builder.Property(i => i.Booking)
               .HasColumnType("jsonb")
               .HasConversion(
                   v => JsonSerializer.Serialize(v, Json),
                   v => JsonSerializer.Deserialize<List<BookingRef>>(v, Json) ?? new List<BookingRef>());

        builder.Property(i => i.Suggestions)
               .HasColumnType("jsonb")
               .HasConversion(
                   v => JsonSerializer.Serialize(v, Json),
                   v => JsonSerializer.Deserialize<List<SuggestCard>>(v, Json) ?? new List<SuggestCard>());
    }
}
