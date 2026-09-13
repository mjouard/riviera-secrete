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
    return ok ? 0 : 1;
}

var dataDir = FindDataDir();
Console.WriteLine($"Data dir: {dataDir}");
var (villes, lieux, activites) = await DatabaseSeeder.SyncNewContentAsync(db, dataDir);

Console.WriteLine($"Sync terminée — villes ajoutées: {villes}, lieux ajoutés: {lieux}, activités ajoutées: {activites}");
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
