namespace RivieraSecrete.Domain.Entities;

/// <summary>
/// Itinéraire composé par un visiteur sans compte, persisté côté serveur pour survivre à un F5
/// et se partager par un lien court (<c>/i/{Id}</c>) — voir ROADMAP.md § "4d. Itinéraire
/// composé". Distinct de <see cref="UserItineraire"/> : celui-ci est *toujours* rattaché à un
/// compte (CRUD protégé par JWT), alors qu'un <see cref="ItineraireCompose"/> n'a besoin
/// d'aucun compte pour exister — <see cref="UserId"/> n'est renseigné que si le visiteur était
/// déjà connecté au moment de la création (POST avec un Authorization Bearer valide), pas via
/// un endpoint de rattachement après coup (hors périmètre de ce lot).
/// </summary>
public class ItineraireCompose
{
    /// <summary>Identifiant court, non devinable, généré côté C# (voir GenerateShortId dans
    /// Program.cs) — PAS un Guid de base de données : il doit rester court dans l'URL
    /// (/i/{Id}) tout en étant assez long pour ne pas être énumérable.</summary>
    public string Id { get; set; } = default!;

    /// <summary>Secret séparé de l'Id, connu seulement du créateur (jamais renvoyé par le GET
    /// public) — permet de modifier/supprimer l'itinéraire sans compte. Un visiteur qui a le
    /// lien /i/{Id} ne peut donc pas modifier l'itinéraire d'un autre juste en devinant l'Id.</summary>
    public string EditToken { get; set; } = default!;

    /// <summary>Même forme que UserItineraire.Days : un tableau de jours, chaque jour un
    /// tableau de slugs de lieux dans l'ordre du programme.</summary>
    public string[][] Jours { get; set; } = [];

    public string Nom { get; set; } = default!;
    public string DureeKey { get; set; } = default!;
    public DateTime CreatedAt { get; set; }

    /// <summary>Toujours "lien" pour l'instant (lecture publique par quiconque a le lien) —
    /// champ prévu pour une visibilité plus restrictive future, jamais lue aujourd'hui.</summary>
    public string VisibiliteLien { get; set; } = "lien";

    /// <summary>Renseigné seulement si le créateur était connecté au moment du POST. Autorise
    /// alors PATCH/DELETE via son propre JWT, en plus de l'EditToken.</summary>
    public Guid? UserId { get; set; }
    public User? User { get; set; }
}
