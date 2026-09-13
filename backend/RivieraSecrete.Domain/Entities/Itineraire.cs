namespace RivieraSecrete.Domain.Entities;

public class Itineraire
{
    public int Id { get; set; }
    public string Slug { get; set; } = default!;
    public string Titre { get; set; } = default!;
    public string Badge { get; set; } = default!;
    public string Description { get; set; } = default!;
    public string Intro { get; set; } = default!;
    public string HeroImgTag { get; set; } = default!;
    public string MapLabel { get; set; } = default!;

    // Traduction anglaise — colonnes jumelles nullable, voir
    // .claude/memory/project_version_anglaise.md. Ne couvre que les champs scalaires ;
    // les libellés imbriqués dans Items/Booking/Suggestions (JSON) seront traduits en
    // phase 2/3 directement dans leur structure JSON, sans nouvelle migration nécessaire.
    public string? TitreEn { get; set; }
    public string? BadgeEn { get; set; }
    public string? DescriptionEn { get; set; }
    public string? IntroEn { get; set; }
    public string? MapLabelEn { get; set; }

    // Stored as JSON columns — structures complexes, snapshot éditorial
    public List<MetaPill> MetaPills { get; set; } = [];
    public List<ItineraireItem> Items { get; set; } = [];
    public List<BookingRef> Booking { get; set; } = [];
    public List<SuggestCard> Suggestions { get; set; } = [];
}

// NomEn/DescEn/DormirAEn : traduction anglaise, voir .claude/memory/project_version_anglaise.md.
// Commune reste un nom propre, jamais traduit. "transit" utilise Desc/DescEn (le texte
// "🚗 15 min — D2559, bord de mer Juan-les-Pins" affiché tel quel).
public record ItineraireItem(
    string Type,           // "stop" | "transit" | "sleep"
    string? Heure,
    string? LieuSlug,
    string? Nom,
    string? Commune,
    string? Desc,
    List<StopActivite>? Activites,
    string? DormirA = null,
    string? NomEn = null,
    string? DescEn = null,
    string? DormirAEn = null
);

// LabelEn : traduction anglaise du libellé composite de la pastille (ex. "Sentier Tirepoil ·
// Libre" → "Tirepoil path · Free"), stockée telle quelle plutôt que recomposée au rendu.
public record StopActivite(
    string Label,
    string Cls,
    string? LieuSlug,
    string? ActiviteId,
    string? Url,
    string? LabelEn = null
);

// LieuLabelEn/NomLabelEn/ExtraSpansEn : traduction anglaise des libellés d'affichage de la
// carte "à réserver" — Duree/Prix de l'activité référencée viennent d'Activite.DureeEn/PrixEn
// (résolue à l'affichage via lieuSlug+activiteId), pas d'ici.
public record BookingRef(
    string LieuLabel,
    string NomLabel,
    string LinkText,
    List<string> ExtraSpans,
    string LieuSlug,
    string ActiviteId,
    string? LieuLabelEn = null,
    string? NomLabelEn = null,
    List<string>? ExtraSpansEn = null
);

// TitreEn/BadgeEn/AltEn : traduction anglaise.
public record SuggestCard(
    string Href, string Img, string Alt, string Badge, string Titre,
    string? TitreEn = null, string? BadgeEn = null, string? AltEn = null
);
