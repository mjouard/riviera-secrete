namespace RivieraSecrete.Domain.Entities;

public class Itineraire
{
    public int Id { get; set; }
    public string Slug { get; set; } = default!;
    public string Titre { get; set; } = default!;
    public string SousTitre { get; set; } = default!;
    public string Description { get; set; } = default!;
    public string DureeLabel { get; set; } = default!;
    public string HeroImgTag { get; set; } = default!;

    // Stored as JSON — structure complexe, snapshot éditorial
    public List<ItineraireStop> Stops { get; set; } = [];
    public List<SuggestCard> Suggestions { get; set; } = [];
}

public record ItineraireStop(
    string Type,           // "stop" | "sleep"
    string? LieuSlug,
    string? Label,
    List<ItinPill>? Pills,
    ItinTransit? Transit,
    ItinBookingRef? Booking
);

public record ItinPill(string Icon, string Text);

public record ItinTransit(string Mode, string Duree, string? Detail);

public record ItinBookingRef(string LieuSlug, string ActiviteId, string? NomLabel, string? LieuLabel, string? LinkText);

public record SuggestCard(string Slug, string Titre, string Img, string Alt, string Etapes, string Duree, string Blurb);
