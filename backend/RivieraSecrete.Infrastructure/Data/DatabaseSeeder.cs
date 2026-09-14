using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using RivieraSecrete.Domain.Entities;

namespace RivieraSecrete.Infrastructure.Data;

public static class DatabaseSeeder
{
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    private static Ville BuildVille(JsonNode v) => new()
    {
        Slug          = v["slug"]!.GetValue<string>(),
        Nom           = v["nom"]!.GetValue<string>(),
        NomEn         = v["nomEn"]?.GetValue<string>(),
        RegionSlug    = v["regionSlug"]!.GetValue<string>(),
        RegionLabel   = v["regionLabel"]!.GetValue<string>(),
        Lat           = v["lat"]!.GetValue<double>(),
        Lng           = v["lng"]!.GetValue<double>(),
        Description   = v["description"]!.GetValue<string>(),
        DescriptionEn = v["descriptionEn"]?.GetValue<string>(),
        ThumbImage    = v["thumbImage"]!.GetValue<string>(),
    };

    private static Lieu BuildLieu(JsonNode l)
    {
        var lieu = new Lieu
        {
            Slug          = l["slug"]!.GetValue<string>(),
            VilleSlug     = l["villeSlug"]!.GetValue<string>(),
            Nom           = l["nom"]!.GetValue<string>(),
            NomEn         = l["nomEn"]?.GetValue<string>(),
            Commune       = l["commune"]!.GetValue<string>(),
            RegionSlug    = l["regionSlug"]!.GetValue<string>(),
            RegionLabel   = l["regionLabel"]!.GetValue<string>(),
            Lat           = l["lat"]!.GetValue<double>(),
            Lng           = l["lng"]!.GetValue<double>(),
            Description   = l["description"]!.GetValue<string>(),
            DescriptionEn = l["descriptionEn"]?.GetValue<string>(),
            Description2  = l["description2"]?.GetValue<string>(),
            Description2En= l["description2En"]?.GetValue<string>(),
            HeroImage   = l["heroImage"]!.GetValue<string>(),
            HeroAlt     = l["heroAlt"]!.GetValue<string>(),
            HeroSlides  = l["heroSlides"]?.GetValue<int>(),
            ThumbImage  = l["thumbImage"]!.GetValue<string>(),
            Badges      = l["badges"]?.Deserialize<List<string>>(JsonOpts) ?? [],
            MetaPills   = l["metaPills"]?.Deserialize<List<MetaPill>>(JsonOpts) ?? [],
            Tips        = l["tips"]?.Deserialize<List<Tip>>(JsonOpts) ?? [],
            Related     = l["related"]?.Deserialize<List<RelatedCard>>(JsonOpts) ?? [],
        };

        var activitesNode = l["activites"]?.AsArray();
        if (activitesNode != null)
            foreach (var a in activitesNode)
                lieu.Activites.Add(BuildActivite(a!));

        return lieu;
    }

    private static Activite BuildActivite(JsonNode a) => new()
    {
        ActiviteId = a["id"]!.GetValue<string>(),
        Nom        = a["nom"]!.GetValue<string>(),
        NomEn      = a["nomEn"]?.GetValue<string>(),
        Badge      = a["badge"]!.GetValue<string>(),
        Duree      = a["duree"]!.GetValue<string>(),
        DureeEn    = a["dureeEn"]?.GetValue<string>(),
        Prix       = a["prix"]!.GetValue<string>(),
        PrixEn     = a["prixEn"]?.GetValue<string>(),
        Url        = a["url"]!.GetValue<string>(),
        Image      = a["image"]!.GetValue<string>(),
        Alt        = a["alt"]!.GetValue<string>(),
        AltEn      = a["altEn"]?.GetValue<string>(),
        LinkText   = a["linkText"]!.GetValue<string>(),
        Horaires   = a["horaires"]?.GetValue<string>(),
        HorairesEn = a["horairesEn"]?.GetValue<string>(),
        FermeJours = a["fermeJours"]?.Deserialize<List<int>>(JsonOpts) ?? [],
    };

    private static Itineraire BuildItineraire(JsonNode i) => new()
    {
        Slug          = i["slug"]!.GetValue<string>(),
        Titre         = i["titre"]!.GetValue<string>(),
        TitreEn       = i["titreEn"]?.GetValue<string>(),
        Badge         = i["badge"]!.GetValue<string>(),
        BadgeEn       = i["badgeEn"]?.GetValue<string>(),
        Description   = i["description"]!.GetValue<string>(),
        DescriptionEn = i["descriptionEn"]?.GetValue<string>(),
        Intro         = i["intro"]?.GetValue<string>() ?? i["description"]!.GetValue<string>(),
        IntroEn       = i["introEn"]?.GetValue<string>(),
        HeroImgTag    = i["heroImgTag"]!.GetValue<string>(),
        MapLabel      = i["mapLabel"]?.GetValue<string>() ?? "",
        MapLabelEn    = i["mapLabelEn"]?.GetValue<string>(),
        MetaPills   = i["metaPills"]?.Deserialize<List<MetaPill>>(JsonOpts) ?? [],
        Items       = i["items"]?.Deserialize<List<ItineraireItem>>(JsonOpts) ?? [],
        Booking     = i["booking"]?.Deserialize<List<BookingRef>>(JsonOpts) ?? [],
        Suggestions = i["suggestions"]?.Deserialize<List<SuggestCard>>(JsonOpts) ?? [],
    };

    /// <summary>
    /// Seed initial complet — no-op si la table Villes contient déjà des lignes (voir
    /// CLAUDE.md "Data model" : ce n'est PAS un chemin de mise à jour, seulement le tout
    /// premier seed sur une base vierge). Pour ajouter du contenu à une base déjà seedée
    /// (ex. le chantier "villes manquantes"), utiliser <see cref="SyncNewContentAsync"/>.
    /// </summary>
    public static async Task SeedAsync(AppDbContext db, string dataDir)
    {
        if (await db.Villes.AnyAsync()) return; // already seeded

        var villesRaw = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(dataDir, "villes.json")))!.AsArray();
        db.Villes.AddRange(villesRaw.Select(v => BuildVille(v!)));
        await db.SaveChangesAsync();

        var lieuxRaw = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(dataDir, "lieux.json")))!.AsArray();
        db.Lieux.AddRange(lieuxRaw.Select(l => BuildLieu(l!)));
        await db.SaveChangesAsync();

        var itinRaw = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(dataDir, "itineraires.json")))!.AsArray();
        db.Itineraires.AddRange(itinRaw.Select(i => BuildItineraire(i!)));
        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Sync additive et idempotente : n'insère que les villes/lieux/activités de
    /// data/*.json dont le slug (ou, pour une activité, le couple lieu+activiteId)
    /// n'existe pas déjà en base. Ne modifie et ne supprime jamais une ligne existante —
    /// safe à ré-exécuter autant de fois que nécessaire au fil d'un chantier incrémental
    /// (voir .claude/memory/project_villes_expansion.md). Les itinéraires ne sont
    /// volontairement pas couverts ici (aucun nouvel itinéraire dans ce chantier).
    /// </summary>
    public static async Task<(int villes, int lieux, int activites)> SyncNewContentAsync(AppDbContext db, string dataDir)
    {
        var existingVilleSlugs = (await db.Villes.Select(v => v.Slug).ToListAsync()).ToHashSet();
        var villesRaw = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(dataDir, "villes.json")))!.AsArray();
        var newVilles = villesRaw
            .Select(v => v!)
            .Where(v => !existingVilleSlugs.Contains(v["slug"]!.GetValue<string>()))
            .Select(BuildVille)
            .ToList();
        db.Villes.AddRange(newVilles);
        if (newVilles.Count > 0) await db.SaveChangesAsync();

        var existingLieuSlugs = (await db.Lieux.Select(l => l.Slug).ToListAsync()).ToHashSet();
        var lieuxRaw = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(dataDir, "lieux.json")))!.AsArray();

        var newLieux = new List<Lieu>();
        var addedActivitesCount = 0;
        foreach (var lNode in lieuxRaw)
        {
            var l = lNode!;
            var slug = l["slug"]!.GetValue<string>();
            if (!existingLieuSlugs.Contains(slug))
            {
                var lieu = BuildLieu(l);
                addedActivitesCount += lieu.Activites.Count;
                newLieux.Add(lieu);
                continue;
            }

            // Lieu déjà présent : vérifier si de nouvelles activités ont été ajoutées dessus.
            var activitesNode = l["activites"]?.AsArray();
            if (activitesNode == null || activitesNode.Count == 0) continue;

            var dbLieu = await db.Lieux.Include(x => x.Activites).FirstAsync(x => x.Slug == slug);
            var existingActiviteIds = dbLieu.Activites.Select(a => a.ActiviteId).ToHashSet();
            foreach (var aNode in activitesNode)
            {
                var a = aNode!;
                var activiteId = a["id"]!.GetValue<string>();
                if (existingActiviteIds.Contains(activiteId)) continue;
                dbLieu.Activites.Add(BuildActivite(a));
                addedActivitesCount++;
            }
        }
        db.Lieux.AddRange(newLieux);
        if (newLieux.Count > 0 || addedActivitesCount > 0) await db.SaveChangesAsync();

        return (newVilles.Count, newLieux.Count, addedActivitesCount);
    }

    /// <summary>
    /// Recopie depuis data/lieux.json les champs mutables d'un lieu EXISTANT (Description,
    /// Description2, HeroAlt, images, Badges, MetaPills, Tips, Related, **Lat/Lng**) sur
    /// la ligne DB correspondante — jamais Id/Slug/VilleSlug/Activites (gérés par
    /// SyncNewContentAsync / rename-lieu / remove-activite). Utile quand une correction de
    /// contenu (ex. un `related[]` qui pointait vers un slug renommé/supprimé) doit être
    /// répercutée sur un lieu déjà synchronisé. Retourne false si le slug n'existe ni en
    /// DB ni dans le JSON.
    /// </summary>
    public static async Task<bool> RefreshLieuFieldsAsync(AppDbContext db, string dataDir, string slug)
    {
        var dbLieu = await db.Lieux.FirstOrDefaultAsync(l => l.Slug == slug);
        if (dbLieu is null) return false;

        var lieuxRaw = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(dataDir, "lieux.json")))!.AsArray();
        var jsonLieu = lieuxRaw.Select(l => l!).FirstOrDefault(l => l["slug"]!.GetValue<string>() == slug);
        if (jsonLieu is null) return false;

        dbLieu.Description    = jsonLieu["description"]!.GetValue<string>();
        dbLieu.DescriptionEn  = jsonLieu["descriptionEn"]?.GetValue<string>();
        dbLieu.Description2   = jsonLieu["description2"]?.GetValue<string>();
        dbLieu.Description2En = jsonLieu["description2En"]?.GetValue<string>();
        // `Nom` manquait alors que `NomEn` était bien recopié : renommer un lieu en français
        // dans le JSON était annoncé « rafraîchi » sans jamais partir en base, et la version
        // anglaise se retrouvait seule à jour. Même angle mort que lat/lng (cf. 1434d41).
        dbLieu.Nom          = jsonLieu["nom"]!.GetValue<string>();
        dbLieu.NomEn        = jsonLieu["nomEn"]?.GetValue<string>();
        dbLieu.HeroAlt      = jsonLieu["heroAlt"]!.GetValue<string>();
        dbLieu.HeroImage    = jsonLieu["heroImage"]!.GetValue<string>();
        dbLieu.ThumbImage   = jsonLieu["thumbImage"]!.GetValue<string>();
        dbLieu.Badges       = jsonLieu["badges"]?.Deserialize<List<string>>(JsonOpts) ?? [];
        dbLieu.MetaPills    = jsonLieu["metaPills"]?.Deserialize<List<MetaPill>>(JsonOpts) ?? [];
        dbLieu.Tips         = jsonLieu["tips"]?.Deserialize<List<Tip>>(JsonOpts) ?? [];
        dbLieu.Related      = jsonLieu["related"]?.Deserialize<List<RelatedCard>>(JsonOpts) ?? [];
        // Les coordonnées manquaient ici : une correction de lat/lng dans le JSON était donc
        // signalée « rafraîchie » alors qu'elle ne partait jamais en base. Découvert en
        // corrigeant Èze, qui pointait 8 km en pleine mer (2026-09-14).
        dbLieu.Lat          = jsonLieu["lat"]!.GetValue<double>();
        dbLieu.Lng          = jsonLieu["lng"]!.GetValue<double>();

        await db.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Équivalent de <see cref="RefreshLieuFieldsAsync"/> pour une Ville (habituellement son
    /// ThumbImage, ex. après avoir remplacé le placeholder picsum par une vraie photo, ou
    /// ses coordonnées — voir data/villes.json). Ne touche jamais Id/Slug/Lieux.
    /// </summary>
    public static async Task<bool> RefreshVilleFieldsAsync(AppDbContext db, string dataDir, string slug)
    {
        var dbVille = await db.Villes.FirstOrDefaultAsync(v => v.Slug == slug);
        if (dbVille is null) return false;

        var villesRaw = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(dataDir, "villes.json")))!.AsArray();
        var jsonVille = villesRaw.Select(v => v!).FirstOrDefault(v => v["slug"]!.GetValue<string>() == slug);
        if (jsonVille is null) return false;

        dbVille.Description   = jsonVille["description"]!.GetValue<string>();
        dbVille.DescriptionEn = jsonVille["descriptionEn"]?.GetValue<string>();
        dbVille.Nom           = jsonVille["nom"]!.GetValue<string>();  // même angle mort que côté lieu
        dbVille.NomEn         = jsonVille["nomEn"]?.GetValue<string>();
        dbVille.ThumbImage    = jsonVille["thumbImage"]!.GetValue<string>();
        // Mêmes coordonnées manquantes que dans RefreshLieuFieldsAsync — et c'est bien une
        // ville qui portait le marqueur en mer (`eze`, plus `cannes` posée sur Lérins).
        dbVille.Lat           = jsonVille["lat"]!.GetValue<double>();
        dbVille.Lng           = jsonVille["lng"]!.GetValue<double>();

        await db.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Recopie depuis data/lieux.json tous les champs mutables d'une activité EXISTANTE
    /// (Nom, Badge, Duree, Prix, Url, Image, Alt, LinkText) sur la ligne DB correspondante —
    /// jamais Id/ActiviteId/LieuId. `RefreshLieuFieldsAsync` ne touche pas aux activités
    /// d'un lieu, donc c'est le seul chemin pour corriger une URL cassée ou remplacer le
    /// placeholder image d'une activité déjà synchronisée (voir le chantier vignettes
    /// d'activités, .claude/memory/project_villes_expansion.md).
    /// </summary>
    public static async Task<bool> RefreshActiviteAsync(AppDbContext db, string dataDir, string lieuSlug, string activiteId)
    {
        var dbLieu = await db.Lieux.Include(l => l.Activites).FirstOrDefaultAsync(l => l.Slug == lieuSlug);
        var dbActivite = dbLieu?.Activites.FirstOrDefault(a => a.ActiviteId == activiteId);
        if (dbActivite is null) return false;

        var lieuxRaw = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(dataDir, "lieux.json")))!.AsArray();
        var jsonLieu = lieuxRaw.Select(l => l!).FirstOrDefault(l => l["slug"]!.GetValue<string>() == lieuSlug);
        var jsonActivite = jsonLieu?["activites"]?.AsArray().Select(a => a!)
            .FirstOrDefault(a => a["id"]!.GetValue<string>() == activiteId);
        if (jsonActivite is null) return false;

        dbActivite.Nom      = jsonActivite["nom"]!.GetValue<string>();
        dbActivite.NomEn    = jsonActivite["nomEn"]?.GetValue<string>();
        dbActivite.Badge    = jsonActivite["badge"]!.GetValue<string>();
        dbActivite.Duree    = jsonActivite["duree"]!.GetValue<string>();
        dbActivite.DureeEn  = jsonActivite["dureeEn"]?.GetValue<string>();
        dbActivite.Prix     = jsonActivite["prix"]!.GetValue<string>();
        dbActivite.PrixEn   = jsonActivite["prixEn"]?.GetValue<string>();
        dbActivite.Url      = jsonActivite["url"]!.GetValue<string>();
        dbActivite.Image    = jsonActivite["image"]!.GetValue<string>();
        dbActivite.Alt      = jsonActivite["alt"]!.GetValue<string>();
        dbActivite.AltEn    = jsonActivite["altEn"]?.GetValue<string>();
        dbActivite.LinkText = jsonActivite["linkText"]!.GetValue<string>();
        dbActivite.Horaires   = jsonActivite["horaires"]?.GetValue<string>();
        dbActivite.HorairesEn = jsonActivite["horairesEn"]?.GetValue<string>();
        dbActivite.FermeJours = jsonActivite["fermeJours"]?.Deserialize<List<int>>(JsonOpts) ?? [];

        await db.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Recopie depuis data/itineraires.json tous les champs mutables d'un itinéraire
    /// EXISTANT (Titre, Badge, Description, Intro, MapLabel + leurs variantes *En, MetaPills,
    /// Items, Booking, Suggestions) sur la ligne DB correspondante — jamais Id/Slug. Les
    /// itinéraires ne sont pas couverts par `SyncNewContentAsync` (aucun nouvel itinéraire
    /// créé depuis le seed initial), donc c'est le seul chemin pour répercuter une
    /// traduction anglaise ou toute autre correction de contenu déjà en DB (voir
    /// .claude/memory/project_version_anglaise.md).
    /// </summary>
    public static async Task<bool> RefreshItineraireFieldsAsync(AppDbContext db, string dataDir, string slug)
    {
        var dbItin = await db.Itineraires.FirstOrDefaultAsync(i => i.Slug == slug);
        if (dbItin is null) return false;

        var itinRaw = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(dataDir, "itineraires.json")))!.AsArray();
        var jsonItin = itinRaw.Select(i => i!).FirstOrDefault(i => i["slug"]!.GetValue<string>() == slug);
        if (jsonItin is null) return false;

        dbItin.Titre         = jsonItin["titre"]!.GetValue<string>();
        dbItin.TitreEn       = jsonItin["titreEn"]?.GetValue<string>();
        dbItin.Badge         = jsonItin["badge"]!.GetValue<string>();
        dbItin.BadgeEn       = jsonItin["badgeEn"]?.GetValue<string>();
        dbItin.Description   = jsonItin["description"]!.GetValue<string>();
        dbItin.DescriptionEn = jsonItin["descriptionEn"]?.GetValue<string>();
        dbItin.Intro         = jsonItin["intro"]?.GetValue<string>() ?? jsonItin["description"]!.GetValue<string>();
        dbItin.IntroEn       = jsonItin["introEn"]?.GetValue<string>();
        dbItin.MapLabel      = jsonItin["mapLabel"]?.GetValue<string>() ?? "";
        dbItin.MapLabelEn    = jsonItin["mapLabelEn"]?.GetValue<string>();
        dbItin.MetaPills     = jsonItin["metaPills"]?.Deserialize<List<MetaPill>>(JsonOpts) ?? [];
        dbItin.Items         = jsonItin["items"]?.Deserialize<List<ItineraireItem>>(JsonOpts) ?? [];
        dbItin.Booking       = jsonItin["booking"]?.Deserialize<List<BookingRef>>(JsonOpts) ?? [];
        dbItin.Suggestions   = jsonItin["suggestions"]?.Deserialize<List<SuggestCard>>(JsonOpts) ?? [];

        await db.SaveChangesAsync();
        return true;
    }
}
