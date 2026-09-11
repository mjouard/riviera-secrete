using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RivieraSecrete.Domain.Entities;

namespace RivieraSecrete.Infrastructure.Data.Configurations;

public class ItineraireConfiguration : IEntityTypeConfiguration<Itineraire>
{
    public void Configure(EntityTypeBuilder<Itineraire> builder)
    {
        builder.HasKey(i => i.Id);
        builder.HasIndex(i => i.Slug).IsUnique();
        builder.Property(i => i.Slug).HasMaxLength(100).IsRequired();
        builder.Property(i => i.Titre).HasMaxLength(200).IsRequired();

        builder.OwnsMany(i => i.Stops, b => b.ToJson());
        builder.OwnsMany(i => i.Suggestions, b => b.ToJson());
    }
}
