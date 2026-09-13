namespace RivieraSecrete.Domain.Entities;

public class Lieu
{
    public int Id { get; set; }
    public string Slug { get; set; } = default!;
    public string Nom { get; set; } = default!;
    public string Description { get; set; } = default!;
    public string? Description2 { get; set; }

    // Traduction anglaise — colonnes jumelles nullable, voir
    // .claude/memory/project_version_anglaise.md. Tant que non traduit (null), le frontend
    // retombe sur le champ français correspondant.
    public string? NomEn { get; set; }
    public string? DescriptionEn { get; set; }
    public string? Description2En { get; set; }
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

// LabelEn/ValeurEn : traduction anglaise, voir .claude/memory/project_version_anglaise.md.
// Partagé par Lieu.MetaPills et Itineraire.MetaPills.
public record MetaPill(string Label, string Valeur, string? LabelEn = null, string? ValeurEn = null);

// LabelEn/TexteEn : traduction anglaise, voir .claude/memory/project_version_anglaise.md.
// Colonne JSON (jsonb) sérialisée en camelCase via System.Text.Json — ajouter un champ ici
// ne nécessite pas de migration EF, seulement de peupler labelEn/texteEn dans data/lieux.json.
public record Tip(string Label, string Texte, string? LabelEn = null, string? TexteEn = null);

// TitreEn/BlurbEn/AltEn : traduction anglaise. Region reste un nom de commune (nom propre,
// ex. "Beaulieu-sur-Mer"), jamais traduit — comme Lieu.Commune ailleurs dans l'app.
public record RelatedCard(
    string Href, string Img, string Alt, string Stamp, string Region, string Titre, string Blurb,
    string? TitreEn = null, string? BlurbEn = null, string? AltEn = null
);
