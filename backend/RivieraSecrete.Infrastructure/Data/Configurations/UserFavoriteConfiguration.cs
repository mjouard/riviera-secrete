using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RivieraSecrete.Domain.Entities;

namespace RivieraSecrete.Infrastructure.Data.Configurations;

public class UserFavoriteConfiguration : IEntityTypeConfiguration<UserFavorite>
{
    public void Configure(EntityTypeBuilder<UserFavorite> builder)
    {
        builder.HasKey(f => f.Id);
        builder.Property(f => f.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(f => f.LieuSlug).HasMaxLength(100).IsRequired();
        builder.Property(f => f.CreatedAt).HasDefaultValueSql("now()");
        builder.HasIndex(f => new { f.UserId, f.LieuSlug }).IsUnique();
    }
}
