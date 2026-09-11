using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using RivieraSecrete.Domain.Entities;

namespace RivieraSecrete.Infrastructure.Data;

public static class DatabaseSeeder
{
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    public static async Task SeedAsync(AppDbContext db, string dataDir)
    {
        if (await db.Villes.AnyAsync()) return; // already seeded

        // 1. Villes
        var villesJson = await File.ReadAllTextAsync(Path.Combine(dataDir, "villes.json"));
        var villesRaw = JsonNode.Parse(villesJson)!.AsArray();
        var villes = villesRaw.Select(v => new Ville
        {
            Slug        = v!["slug"]!.GetValue<string>(),
            Nom         = v["nom"]!.GetValue<string>(),
            RegionSlug  = v["regionSlug"]!.GetValue<string>(),
            RegionLabel = v["regionLabel"]!.GetValue<string>(),
            Lat         = v["lat"]!.GetValue<double>(),
            Lng         = v["lng"]!.GetValue<double>(),
            Description = v["description"]!.GetValue<string>(),
            ThumbImage  = v["thumbImage"]!.GetValue<string>(),
        }).ToList();
        db.Villes.AddRange(villes);
        await db.SaveChangesAsync();

        // 2. Lieux + Activités
        var lieuxJson = await File.ReadAllTextAsync(Path.Combine(dataDir, "lieux.json"));
        var lieuxRaw  = JsonNode.Parse(lieuxJson)!.AsArray();

        foreach (var l in lieuxRaw)
        {
            var lieu = new Lieu
            {
                Slug        = l!["slug"]!.GetValue<string>(),
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
            {
                foreach (var a in activitesNode)
                {
                    lieu.Activites.Add(new Activite
                    {
                        ActiviteId = a!["id"]!.GetValue<string>(),
                        Nom        = a["nom"]!.GetValue<string>(),
                        Badge      = a["badge"]!.GetValue<string>(),
                        Duree      = a["duree"]!.GetValue<string>(),
                        Prix       = a["prix"]!.GetValue<string>(),
                        Url        = a["url"]!.GetValue<string>(),
                        Image      = a["image"]!.GetValue<string>(),
                        Alt        = a["alt"]!.GetValue<string>(),
                        LinkText   = a["linkText"]!.GetValue<string>(),
                    });
                }
            }

            db.Lieux.Add(lieu);
        }
        await db.SaveChangesAsync();

        // 3. Itinéraires
        var itinJson = await File.ReadAllTextAsync(Path.Combine(dataDir, "itineraires.json"));
        var itinRaw  = JsonNode.Parse(itinJson)!.AsArray();

        foreach (var i in itinRaw)
        {
            var itin = new Itineraire
            {
                Slug        = i!["slug"]!.GetValue<string>(),
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
            db.Itineraires.Add(itin);
        }
        await db.SaveChangesAsync();
    }
}
