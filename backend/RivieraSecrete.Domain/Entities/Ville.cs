namespace RivieraSecrete.Domain.Entities;

public class Ville
{
    public int Id { get; set; }
    public string Slug { get; set; } = default!;
    public string Nom { get; set; } = default!;
    public string RegionSlug { get; set; } = default!;
    public string RegionLabel { get; set; } = default!;
    public double Lat { get; set; }
    public double Lng { get; set; }
    public string Description { get; set; } = default!;
    public string ThumbImage { get; set; } = default!;

    // Traduction anglaise — colonnes jumelles nullable, voir
    // .claude/memory/project_version_anglaise.md.
    public string? NomEn { get; set; }
    public string? DescriptionEn { get; set; }

    // Navigation
    public ICollection<Lieu> Lieux { get; set; } = [];
}
