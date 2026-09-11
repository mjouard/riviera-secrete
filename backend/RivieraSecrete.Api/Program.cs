using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using RivieraSecrete.Infrastructure.Data;
using RivieraSecrete.Domain.Entities;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.ConfigureHttpJsonOptions(opts =>
    opts.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(
            builder.Configuration["Cors:AllowedOrigin"] ?? "http://localhost:3000"
        ).AllowAnyHeader().AllowAnyMethod());
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseCors();

app.MapGet("/api/lieux", async (AppDbContext db) =>
    await db.Lieux.Include(l => l.Activites).OrderBy(l => l.Id).ToListAsync());

app.MapGet("/api/lieux/{slug}", async (string slug, AppDbContext db) =>
    await db.Lieux.Include(l => l.Activites).FirstOrDefaultAsync(l => l.Slug == slug)
    is { } lieu ? Results.Ok(lieu) : Results.NotFound());

app.MapGet("/api/villes", async (AppDbContext db) =>
    await db.Villes.Include(v => v.Lieux).OrderBy(v => v.Id).ToListAsync());

app.MapGet("/api/villes/{slug}", async (string slug, AppDbContext db) =>
    await db.Villes.Include(v => v.Lieux).ThenInclude(l => l.Activites)
        .FirstOrDefaultAsync(v => v.Slug == slug)
    is { } ville ? Results.Ok(ville) : Results.NotFound());

app.MapGet("/api/itineraires", async (AppDbContext db) =>
    await db.Itineraires.OrderBy(i => i.Id).ToListAsync());

app.MapGet("/api/itineraires/{slug}", async (string slug, AppDbContext db) =>
    await db.Itineraires.FirstOrDefaultAsync(i => i.Slug == slug)
    is { } itin ? Results.Ok(itin) : Results.NotFound());

app.MapGet("/health", () => Results.Ok(new { Status = "ok" }));

// Dev-only: seed database from local JSON files
// POST /api/seed?dataDir=C:/Users/.../data
if (app.Environment.IsDevelopment())
{
    app.MapPost("/api/seed", async (string? dataDir, AppDbContext db) =>
    {
        var dir = dataDir ?? Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "data");
        dir = Path.GetFullPath(dir);
        if (!Directory.Exists(dir))
            return Results.BadRequest(new { Error = $"dataDir not found: {dir}" });
        await DatabaseSeeder.SeedAsync(db, dir);
        return Results.Ok(new { Status = "seeded", DataDir = dir });
    });
}

app.Run();
