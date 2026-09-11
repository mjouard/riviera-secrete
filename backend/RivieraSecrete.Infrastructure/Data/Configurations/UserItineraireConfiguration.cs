using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RivieraSecrete.Domain.Entities;

namespace RivieraSecrete.Infrastructure.Data.Configurations;

public class UserItineraireConfiguration : IEntityTypeConfiguration<UserItineraire>
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public void Configure(EntityTypeBuilder<UserItineraire> builder)
    {
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(i => i.Nom).HasMaxLength(200).IsRequired();
        builder.Property(i => i.DureeKey).HasMaxLength(20).IsRequired();
        builder.Property(i => i.CreatedAt).HasDefaultValueSql("now()");
        builder.Property(i => i.UpdatedAt).HasDefaultValueSql("now()");

        builder.Property(i => i.Days)
               .HasColumnType("jsonb")
               .HasConversion(
                   v => JsonSerializer.Serialize(v, Json),
                   v => JsonSerializer.Deserialize<string[][]>(v, Json) ?? Array.Empty<string[]>());
    }
}
