using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RivieraSecrete.Domain.Entities;

namespace RivieraSecrete.Infrastructure.Data.Configurations;

public class LieuConfiguration : IEntityTypeConfiguration<Lieu>
{
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

        builder.OwnsMany(l => l.MetaPills, b => b.ToJson());
        builder.OwnsMany(l => l.Related, b => b.ToJson());
        builder.Property(l => l.Badges).HasColumnType("jsonb");
        builder.Property(l => l.Tips).HasColumnType("jsonb");
    }
}
