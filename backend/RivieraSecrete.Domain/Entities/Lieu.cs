namespace RivieraSecrete.Domain.Entities;

public class Lieu
{
    public int Id { get; set; }
    public string Slug { get; set; } = default!;
    public string Nom { get; set; } = default!;
    public string Description { get; set; } = default!;
    public string? Description2 { get; set; }
    public string Commune { get; set; } = default!;
    public string RegionSlug { get; set; } = default!;
    public string RegionLabel { get; set; } = default!;
    public string VilleSlug { get; set; } = default!;
    public double Lat { get; set; }
    public double Lng { get; set; }
    public string HeroImage { get; set; } = default!;
    public string HeroAlt { get; set; } = default!;
    public int? HeroSlides { get; set; }
    public string ThumbImage { get; set; } = default!;
    public string OgImage { get; set; } = default!;

    // Stored as JSON columns
    public List<string> Badges { get; set; } = [];
    public List<MetaPill> MetaPills { get; set; } = [];
    public List<Tip> Tips { get; set; } = [];
    public List<RelatedCard> Related { get; set; } = [];

    // Navigation
    public ICollection<Activite> Activites { get; set; } = [];
    public Ville? Ville { get; set; }
}

public record MetaPill(string Label, string Valeur);

public record Tip(string Label, string Texte);

public record RelatedCard(string Href, string Img, string Alt, string Stamp, string Region, string Titre, string Blurb);
