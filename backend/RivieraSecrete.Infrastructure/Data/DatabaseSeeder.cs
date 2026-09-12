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
        Slug        = v["slug"]!.GetValue<string>(),
        Nom         = v["nom"]!.GetValue<string>(),
        RegionSlug  = v["regionSlug"]!.GetValue<string>(),
        RegionLabel = v["regionLabel"]!.GetValue<string>(),
        Lat         = v["lat"]!.GetValue<double>(),
        Lng         = v["lng"]!.GetValue<double>(),
        Description = v["description"]!.GetValue<string>(),
        ThumbImage  = v["thumbImage"]!.GetValue<string>(),
    };

    private static Lieu BuildLieu(JsonNode l)
    {
        var lieu = new Lieu
        {
            Slug        = l["slug"]!.GetValue<string>(),
            VilleSlug   = l["villeSlug"]!.GetValue<string>(),
            Nom         = l["nom"]!.GetValue<string>(),
            Commune     = l["commune"]!.GetValue<string>(),
            RegionSlug  = l["regionSlug"]!.GetValue<string>(),
            RegionLabel = l["regionLabel"]!.GetValue<string>(),
            Lat         = l["lat"]!.GetValue<double>(),
            Lng         = l["lng"]!.GetValue<double>(),
            Description = l["description"]!.GetValue<string>(),
            Description2= l["description2"]?.GetValue<string>(),
            OgImage     = l["ogImage"]!.GetValue<string>(),
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
        Badge      = a["badge"]!.GetValue<string>(),
        Duree      = a["duree"]!.GetValue<string>(),
        Prix       = a["prix"]!.GetValue<string>(),
        Url        = a["url"]!.GetValue<string>(),
        Image      = a["image"]!.GetValue<string>(),
        Alt        = a["alt"]!.GetValue<string>(),
        LinkText   = a["linkText"]!.GetValue<string>(),
    };

    private static Itineraire BuildItineraire(JsonNode i) => new()
    {
        Slug        = i["slug"]!.GetValue<string>(),
        Titre       = i["titre"]!.GetValue<string>(),
        Badge       = i["badge"]!.GetValue<string>(),
        Description = i["description"]!.GetValue<string>(),
        Intro       = i["intro"]?.GetValue<string>() ?? i["description"]!.GetValue<string>(),
        HeroImgTag  = i["heroImgTag"]!.GetValue<string>(),
        MapLabel    = i["mapLabel"]?.GetValue<string>() ?? "",
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
}
