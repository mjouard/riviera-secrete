using Microsoft.EntityFrameworkCore;
using RivieraSecrete.Infrastructure.Data;

// Outil local (jamais déployé) pour synchroniser data/*.json vers la base de prod sans
// jamais toucher aux lignes existantes — voir DatabaseSeeder.SyncNewContentAsync et
// .claude/memory/project_villes_expansion.md pour le contexte complet. Le seed normal
// (POST /api/seed) est un no-op dès que la table Villes a une ligne, donc c'est le seul
// chemin pour faire apparaître du contenu ajouté après le tout premier seed.

var connectionString = Environment.GetEnvironmentVariable("SYNC_CONNECTION_STRING");
if (string.IsNullOrWhiteSpace(connectionString))
{
    Console.Error.WriteLine("SYNC_CONNECTION_STRING doit être défini (connection string Npgsql — utiliser la variable publique DATABASE_PUBLIC_URL du service Postgres Railway, convertie, pas DATABASE_URL qui n'est résolvable que depuis le réseau interne Railway).");
    return 1;
}

var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseNpgsql(connectionString)
    .Options;

await using var db = new AppDbContext(options);

// `fix-lot3-tags-default` : correctif ponctuel pour la migration AddLot3Champs, qui a ajouté
// Lieux.Tags (jsonb, List<string>) avec `defaultValue: ""` — traduit par le provider Npgsql
// en `DEFAULT '{}'` (objet JSON vide) plutôt que `'[]'` (tableau vide), ce qui fait planter
// toute lecture d'un Lieu pas encore rafraîchi (JsonException à la désérialisation en
// List<string>). Corrige les lignes existantes ; le fichier de migration a été corrigé en
// parallèle pour qu'une base neuve n'ait pas le problème. À supprimer une fois que tous les
// lieux ont été rafraîchis depuis le JSON (donc que plus aucune ligne ne porte encore '{}').
if (args is ["fix-lot3-tags-default"])
{
    var n = await db.Database.ExecuteSqlRawAsync("UPDATE \"Lieux\" SET \"Tags\" = '[]' WHERE \"Tags\"::text = '{}'");
    Console.WriteLine($"{n} lieu(x) corrigé(s) ('{{}}' -> '[]' sur Tags).");
    return 0;
}

// `remove-activite <lieuSlug> <activiteId>` : correction ciblée pour une activité
// mal rattachée (ex. deux jardins de Menton trouvés sous cimetiere-vieux-chateau-menton
// alors qu'ils sont à plusieurs km, voir data/lieux.json et le commit qui les a retirés).
// Ne touche qu'une ligne précise identifiée par slug+id exacts, jamais de suppression en
// masse. Le JSON reste la source de vérité : corriger data/lieux.json d'abord, puis
// utiliser cette commande pour répercuter la suppression sur la ligne déjà synchronisée.
if (args is ["remove-activite", var lieuSlug, var activiteId])
{
    var lieu = await db.Lieux.Include(l => l.Activites).FirstOrDefaultAsync(l => l.Slug == lieuSlug);
    if (lieu is null)
    {
        Console.Error.WriteLine($"Aucun lieu avec le slug '{lieuSlug}'.");
        return 1;
    }
    var activite = lieu.Activites.FirstOrDefault(a => a.ActiviteId == activiteId);
    if (activite is null)
    {
        Console.WriteLine($"Aucune activité '{activiteId}' sur le lieu '{lieuSlug}' (déjà absente, rien à faire).");
        return 0;
    }
    db.Activites.Remove(activite);
    await db.SaveChangesAsync();
    Console.WriteLine($"Activité '{activiteId}' retirée du lieu '{lieuSlug}'.");
    await InvaliderCacheFrontendAsync("lieux", "villes", "itineraires");
    return 0;
}

// `rename-lieu <oldSlug> <newSlug>` (+ env NEW_NOM requis, NEW_DESCRIPTION optionnel) :
// recadre un lieu existant (slug/nom/description) sans toucher à ses activités, sa ville,
// ses coordonnées ni son historique. Utilisé pour élargir le "Cimetière du Vieux-Château"
// en "Vieux Menton" — les activités étaient cohérentes pour le lieu, c'est le nom/scope qui
// était trop étroit, pas les activités (voir data/lieux.json et le commit correspondant).
// Les champs texte passent par des variables d'env pour éviter les soucis d'échappement
// shell avec les accents/apostrophes français.
if (args is ["rename-lieu", var oldSlug, var newSlug])
{
    var newNom = Environment.GetEnvironmentVariable("NEW_NOM");
    if (string.IsNullOrWhiteSpace(newNom))
    {
        Console.Error.WriteLine("NEW_NOM doit être défini.");
        return 1;
    }
    var newDescription = Environment.GetEnvironmentVariable("NEW_DESCRIPTION");

    var lieuToRename = await db.Lieux.FirstOrDefaultAsync(l => l.Slug == oldSlug);
    if (lieuToRename is null)
    {
        Console.Error.WriteLine($"Aucun lieu avec le slug '{oldSlug}'.");
        return 1;
    }
    lieuToRename.Slug = newSlug;
    lieuToRename.Nom = newNom;
    if (!string.IsNullOrWhiteSpace(newDescription)) lieuToRename.Description = newDescription;
    await db.SaveChangesAsync();
    Console.WriteLine($"Lieu '{oldSlug}' renommé en '{newSlug}' ({newNom}).");
    await InvaliderCacheFrontendAsync("lieux", "villes", "itineraires");
    return 0;
}

// `refresh-lieu-fields <slug>` : recopie Description/Badges/MetaPills/Tips/Related/images
// depuis data/lieux.json sur la ligne DB existante (jamais Id/Slug/VilleSlug/Activites).
// Utile quand une correction de contenu (ex. un `related[]` pointant vers un slug renommé)
// doit être répercutée sur un lieu déjà synchronisé.
if (args is ["refresh-lieu-fields", var refreshSlug])
{
    var refreshDataDir = FindDataDir();
    var ok = await DatabaseSeeder.RefreshLieuFieldsAsync(db, refreshDataDir, refreshSlug);
    Console.WriteLine(ok
        ? $"Champs du lieu '{refreshSlug}' rafraîchis depuis le JSON."
        : $"Lieu '{refreshSlug}' introuvable en DB ou dans data/lieux.json — rien fait.");
    if (ok) await InvaliderCacheFrontendAsync("lieux", "villes", "itineraires");
    return ok ? 0 : 1;
}

// `refresh-ville-fields <slug>` : équivalent de refresh-lieu-fields pour une ville
// (typiquement son ThumbImage après remplacement d'un placeholder par une vraie photo).
if (args is ["refresh-ville-fields", var refreshVilleSlug])
{
    var refreshVilleDataDir = FindDataDir();
    var ok = await DatabaseSeeder.RefreshVilleFieldsAsync(db, refreshVilleDataDir, refreshVilleSlug);
    Console.WriteLine(ok
        ? $"Champs de la ville '{refreshVilleSlug}' rafraîchis depuis le JSON."
        : $"Ville '{refreshVilleSlug}' introuvable en DB ou dans data/villes.json — rien fait.");
    if (ok) await InvaliderCacheFrontendAsync("villes");
    return ok ? 0 : 1;
}

// `refresh-activite <lieuSlug> <activiteId>` : recopie tous les champs mutables d'une
// activité existante (nom, badge, duree, prix, url, image, alt, linkText) depuis le JSON.
// Nécessaire car refresh-lieu-fields ne touche pas aux activités d'un lieu.
if (args is ["refresh-activite", var refreshLieuSlug, var refreshActiviteId])
{
    var refreshActiviteDataDir = FindDataDir();
    var ok = await DatabaseSeeder.RefreshActiviteAsync(db, refreshActiviteDataDir, refreshLieuSlug, refreshActiviteId);
    Console.WriteLine(ok
        ? $"Activité '{refreshActiviteId}' (lieu '{refreshLieuSlug}') rafraîchie depuis le JSON."
        : $"Activité '{refreshActiviteId}' ou lieu '{refreshLieuSlug}' introuvable — rien fait.");
    if (ok) await InvaliderCacheFrontendAsync("lieux", "villes", "itineraires");
    return ok ? 0 : 1;
}

// `refresh-itineraire-fields <slug>` : recopie tous les champs mutables d'un itinéraire déjà
// synchronisé (Titre/Badge/Description/Intro/MapLabel + leurs variantes *En, MetaPills,
// Items, Booking, Suggestions) depuis data/itineraires.json. Aucune commande de sync
// n'existant pour les itinéraires (voir SyncNewContentAsync), c'est le seul chemin pour
// répercuter une traduction anglaise ou toute autre correction de contenu.
if (args is ["refresh-itineraire-fields", var refreshItinSlug])
{
    var refreshItinDataDir = FindDataDir();
    var ok = await DatabaseSeeder.RefreshItineraireFieldsAsync(db, refreshItinDataDir, refreshItinSlug);
    Console.WriteLine(ok
        ? $"Champs de l'itinéraire '{refreshItinSlug}' rafraîchis depuis le JSON."
        : $"Itinéraire '{refreshItinSlug}' introuvable en DB ou dans data/itineraires.json — rien fait.");
    if (ok) await InvaliderCacheFrontendAsync("itineraires");
    return ok ? 0 : 1;
}

var dataDir = FindDataDir();
Console.WriteLine($"Data dir: {dataDir}");
var (villes, lieux, activites) = await DatabaseSeeder.SyncNewContentAsync(db, dataDir);

Console.WriteLine($"Sync terminée — villes ajoutées: {villes}, lieux ajoutés: {lieux}, activités ajoutées: {activites}");
if (villes + lieux + activites > 0) await InvaliderCacheFrontendAsync("lieux", "villes", "itineraires");
return 0;

static string FindDataDir()
{
    var dir = new DirectoryInfo(AppContext.BaseDirectory);
    while (dir is not null)
    {
        var candidate = Path.Combine(dir.FullName, "data");
        if (Directory.Exists(candidate) && File.Exists(Path.Combine(candidate, "villes.json")))
            return candidate;
        dir = dir.Parent;
    }
    throw new DirectoryNotFoundException("Impossible de localiser le dossier data/ (villes.json introuvable) en remontant depuis " + AppContext.BaseDirectory);
}

/// <summary>
/// Prévient le frontend qu'un contenu a changé, pour qu'il purge son cache ISR.
///
/// Sans cet appel, une correction restait invisible jusqu'à l'expiration du délai d'une
/// heure — donc potentiellement des semaines sur une page peu visitée. C'est ce qui a laissé
/// /en/itineraires/villages-perches proposer à la réservation un château fermé depuis 2015.
///
/// L'échec n'est jamais bloquant : la synchronisation en base, elle, a réussi, et le cache
/// finira par expirer tout seul. On le signale bruyamment plutôt que d'échouer une commande
/// dont le travail est fait.
/// </summary>
static async Task InvaliderCacheFrontendAsync(params string[] tags)
{
    var url = Environment.GetEnvironmentVariable("FRONTEND_URL");
    var secret = Environment.GetEnvironmentVariable("REVALIDATE_SECRET");
    if (string.IsNullOrWhiteSpace(url) || string.IsNullOrWhiteSpace(secret))
    {
        Console.WriteLine("[cache] FRONTEND_URL ou REVALIDATE_SECRET absent — cache ISR non invalidé "
            + "(le contenu se rafraîchira au bout d'une heure).");
        return;
    }

    try
    {
        using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
        var payload = System.Text.Json.JsonSerializer.Serialize(new { tags });
        using var req = new HttpRequestMessage(HttpMethod.Post, $"{url.TrimEnd('/')}/api/revalidate")
        {
            Content = new StringContent(payload, System.Text.Encoding.UTF8, "application/json"),
        };
        req.Headers.Add("x-revalidate-secret", secret);
        var res = await http.SendAsync(req);
        Console.WriteLine(res.IsSuccessStatusCode
            ? $"[cache] invalidé : {string.Join(", ", tags)}"
            : $"[cache] échec ({(int)res.StatusCode}) — {await res.Content.ReadAsStringAsync()}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[cache] échec de l'appel d'invalidation : {ex.Message}");
    }
}
