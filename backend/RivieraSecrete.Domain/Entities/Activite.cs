namespace RivieraSecrete.Domain.Entities;

public class Activite
{
    public int Id { get; set; }
    public string ActiviteId { get; set; } = default!; // slug-style id from JSON
    public string Nom { get; set; } = default!;
    public string Badge { get; set; } = default!; // "gratuit" | "payant"
    public string Duree { get; set; } = default!;
    public string Prix { get; set; } = default!;
    public string Url { get; set; } = default!;
    public string Image { get; set; } = default!;
    public string Alt { get; set; } = default!;
    public string LinkText { get; set; } = default!;

    // Traduction anglaise — colonnes jumelles nullable, voir
    // .claude/memory/project_version_anglaise.md.
    public string? NomEn { get; set; }
    public string? AltEn { get; set; }
    public string? DureeEn { get; set; }
    public string? PrixEn { get; set; }

    /// <summary>
    /// Horaires en texte libre ("10h-18h, 19h en juillet-août"), null si non sourcé.
    /// Volontairement du texte : les horaires réels sont saisonniers et pleins d'exceptions,
    /// les figer dans une structure rigide donnerait une fausse précision.
    /// </summary>
    public string? Horaires { get; set; }
    public string? HorairesEn { get; set; }

    /// <summary>
    /// Jours de fermeture hebdomadaire (0 = dimanche … 6 = samedi), colonne jsonb.
    /// Liste vide = ouvert tous les jours ; null impossible (défaut []), l'absence
    /// d'information se lit sur <see cref="Horaires"/> qui vaut alors null.
    /// C'est la partie exploitable par la machine : elle permet d'avertir « fermé
    /// aujourd'hui », seul affichage qui empêche réellement un déplacement pour rien.
    /// </summary>
    public List<int> FermeJours { get; set; } = [];

    // FK
    public int LieuId { get; set; }
    public Lieu Lieu { get; set; } = default!;
}
