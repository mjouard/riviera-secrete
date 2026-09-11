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

    // Stored as JSON columns — structures complexes, snapshot éditorial
    public List<MetaPill> MetaPills { get; set; } = [];
    public List<ItineraireItem> Items { get; set; } = [];
    public List<BookingRef> Booking { get; set; } = [];
    public List<SuggestCard> Suggestions { get; set; } = [];
}

public record ItineraireItem(
    string Type,           // "stop" | "transit"
    string? Heure,
    string? LieuSlug,
    string? Nom,
    string? Commune,
    string? Desc,
    List<StopActivite>? Activites
);

public record StopActivite(
    string Label,
    string Cls,
    string? LieuSlug,
    string? ActiviteId,
    string? Url
);

public record BookingRef(
    string LieuLabel,
    string NomLabel,
    string LinkText,
    List<string> ExtraSpans,
    string LieuSlug,
    string ActiviteId
);

public record SuggestCard(string Href, string Img, string Alt, string Badge, string Titre);
