using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RivieraSecrete.Domain.Entities;

namespace RivieraSecrete.Infrastructure.Data.Configurations;

public class VilleConfiguration : IEntityTypeConfiguration<Ville>
{
    public void Configure(EntityTypeBuilder<Ville> builder)
    {
        builder.HasKey(v => v.Id);
        builder.HasIndex(v => v.Slug).IsUnique();
        builder.Property(v => v.Slug).HasMaxLength(100).IsRequired();
        builder.Property(v => v.Nom).HasMaxLength(200).IsRequired();
    }
}
