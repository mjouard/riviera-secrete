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

var dataDir = FindDataDir();
Console.WriteLine($"Data dir: {dataDir}");

var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseNpgsql(connectionString)
    .Options;

await using var db = new AppDbContext(options);
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
