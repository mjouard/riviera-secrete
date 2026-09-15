using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RivieraSecrete.Domain.Entities;

namespace RivieraSecrete.Infrastructure.Data.Configurations;

public class ItineraireComposeConfiguration : IEntityTypeConfiguration<ItineraireCompose>
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public void Configure(EntityTypeBuilder<ItineraireCompose> builder)
    {
        // Id généré côté application (voir GenerateShortId, Program.cs) et non par la base —
        // pas de gen_random_uuid() ici, contrairement à UserItineraire : l'Id doit rester court
        // pour l'URL /i/{Id}.
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasMaxLength(20);
        builder.Property(i => i.EditToken).HasMaxLength(64).IsRequired();
        builder.Property(i => i.Nom).HasMaxLength(200).IsRequired();
        builder.Property(i => i.DureeKey).HasMaxLength(20).IsRequired();
        builder.Property(i => i.VisibiliteLien).HasMaxLength(20).HasDefaultValue("lien").IsRequired();
        builder.Property(i => i.CreatedAt).HasDefaultValueSql("now()");

        builder.Property(i => i.Jours)
               .HasColumnType("jsonb")
               .HasConversion(
                   v => JsonSerializer.Serialize(v, Json),
                   v => JsonSerializer.Deserialize<string[][]>(v, Json) ?? Array.Empty<string[]>());

        // UserId nullable : pas de compte requis pour créer un itinéraire composé. Renseigné
        // seulement si le créateur était connecté au moment du POST (voir ItineraireCompose.cs).
        // SetNull plutôt que Cascade : la suppression d'un compte ne doit pas faire disparaître
        // un lien déjà partagé — il redevient simplement un itinéraire anonyme, toujours
        // modifiable via son EditToken.
        builder.HasOne(i => i.User)
               .WithMany()
               .HasForeignKey(i => i.UserId)
               .OnDelete(DeleteBehavior.SetNull)
               .IsRequired(false);
    }
}
