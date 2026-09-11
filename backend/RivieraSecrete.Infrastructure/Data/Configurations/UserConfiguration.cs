using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RivieraSecrete.Domain.Entities;

namespace RivieraSecrete.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.HasIndex(u => u.GoogleId).IsUnique();
        builder.Property(u => u.GoogleId).HasMaxLength(128);
        builder.Property(u => u.PasswordHash).HasMaxLength(200);
        builder.HasIndex(u => u.Email).IsUnique();
        builder.Property(u => u.Email).HasMaxLength(256).IsRequired();
        builder.Property(u => u.Nom).HasMaxLength(200).IsRequired();
        builder.Property(u => u.CreatedAt).HasDefaultValueSql("now()");

        builder.HasMany(u => u.Favorites)
               .WithOne(f => f.User)
               .HasForeignKey(f => f.UserId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.Itineraires)
               .WithOne(i => i.User)
               .HasForeignKey(i => i.UserId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
