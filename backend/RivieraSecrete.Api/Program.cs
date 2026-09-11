using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RivieraSecrete.Domain.Entities;
using RivieraSecrete.Infrastructure.Data;

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

// ── JWT Auth ──────────────────────────────────────────────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"]!;
var jwtIssuer = builder.Configuration["Jwt:Issuer"]!;
var jwtAudience = builder.Configuration["Jwt:Audience"]!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// ── Public endpoints ──────────────────────────────────────────────────────────

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

// ── Auth ──────────────────────────────────────────────────────────────────────

app.MapPost("/api/auth/google-signin", async (GoogleSignInRequest req, AppDbContext db, IConfiguration config) =>
{
    var googleClientId = config["Google:ClientId"];
    if (string.IsNullOrEmpty(googleClientId))
        return Results.Problem("Google ClientId not configured.", statusCode: 500);

    GoogleJsonWebSignature.Payload payload;
    try
    {
        payload = await GoogleJsonWebSignature.ValidateAsync(req.IdToken, new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = [googleClientId],
        });
    }
    catch (InvalidJwtException)
    {
        return Results.Unauthorized();
    }

    var user = await db.Users.FirstOrDefaultAsync(u => u.GoogleId == payload.Subject);
    if (user is null)
    {
        user = new User
        {
            GoogleId = payload.Subject,
            Email = payload.Email,
            Nom = payload.Name ?? payload.Email,
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
    }

    var token = GenerateJwt(user, config);
    return Results.Ok(new { Token = token, User = new { user.Id, user.Email, user.Nom } });
});

// ── Protected: Favoris ────────────────────────────────────────────────────────

app.MapGet("/api/favorites", async (ClaimsPrincipal principal, AppDbContext db) =>
{
    var userId = GetUserId(principal);
    if (userId is null) return Results.Unauthorized();
    var slugs = await db.UserFavorites
        .Where(f => f.UserId == userId)
        .OrderByDescending(f => f.CreatedAt)
        .Select(f => f.LieuSlug)
        .ToListAsync();
    return Results.Ok(slugs);
}).RequireAuthorization();

app.MapPost("/api/favorites/{lieuSlug}", async (string lieuSlug, ClaimsPrincipal principal, AppDbContext db) =>
{
    var userId = GetUserId(principal);
    if (userId is null) return Results.Unauthorized();
    var exists = await db.UserFavorites.AnyAsync(f => f.UserId == userId && f.LieuSlug == lieuSlug);
    if (exists) return Results.Ok();
    db.UserFavorites.Add(new UserFavorite { UserId = userId.Value, LieuSlug = lieuSlug });
    await db.SaveChangesAsync();
    return Results.Created();
}).RequireAuthorization();

app.MapDelete("/api/favorites/{lieuSlug}", async (string lieuSlug, ClaimsPrincipal principal, AppDbContext db) =>
{
    var userId = GetUserId(principal);
    if (userId is null) return Results.Unauthorized();
    var fav = await db.UserFavorites.FirstOrDefaultAsync(f => f.UserId == userId && f.LieuSlug == lieuSlug);
    if (fav is null) return Results.NotFound();
    db.UserFavorites.Remove(fav);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

// ── Protected: Itinéraires custom ─────────────────────────────────────────────

app.MapGet("/api/my-itineraires", async (ClaimsPrincipal principal, AppDbContext db) =>
{
    var userId = GetUserId(principal);
    if (userId is null) return Results.Unauthorized();
    var itins = await db.UserItineraires
        .Where(i => i.UserId == userId)
        .OrderByDescending(i => i.CreatedAt)
        .ToListAsync();
    return Results.Ok(itins);
}).RequireAuthorization();

app.MapPost("/api/my-itineraires", async (ItineraireUpsertRequest req, ClaimsPrincipal principal, AppDbContext db) =>
{
    var userId = GetUserId(principal);
    if (userId is null) return Results.Unauthorized();
    var itin = new UserItineraire
    {
        UserId = userId.Value,
        Nom = req.Nom,
        DureeKey = req.DureeKey,
        Days = req.Days,
    };
    db.UserItineraires.Add(itin);
    await db.SaveChangesAsync();
    return Results.Created($"/api/my-itineraires/{itin.Id}", itin);
}).RequireAuthorization();

app.MapPut("/api/my-itineraires/{id:guid}", async (Guid id, ItineraireUpsertRequest req, ClaimsPrincipal principal, AppDbContext db) =>
{
    var userId = GetUserId(principal);
    if (userId is null) return Results.Unauthorized();
    var itin = await db.UserItineraires.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
    if (itin is null) return Results.NotFound();
    itin.Nom = req.Nom;
    itin.DureeKey = req.DureeKey;
    itin.Days = req.Days;
    itin.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(itin);
}).RequireAuthorization();

app.MapDelete("/api/my-itineraires/{id:guid}", async (Guid id, ClaimsPrincipal principal, AppDbContext db) =>
{
    var userId = GetUserId(principal);
    if (userId is null) return Results.Unauthorized();
    var itin = await db.UserItineraires.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
    if (itin is null) return Results.NotFound();
    db.UserItineraires.Remove(itin);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

// ── Dev-only ──────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

static Guid? GetUserId(ClaimsPrincipal principal)
{
    var sub = principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
    return Guid.TryParse(sub, out var id) ? id : null;
}

static string GenerateJwt(User user, IConfiguration config)
{
    var secret = config["Jwt:Secret"]!;
    var issuer = config["Jwt:Issuer"]!;
    var audience = config["Jwt:Audience"]!;
    var expiryDays = int.TryParse(config["Jwt:ExpiryDays"], out var d) ? d : 30;

    var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
        new Claim(JwtRegisteredClaimNames.Email, user.Email),
        new Claim("nom", user.Nom),
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
    };

    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    var token = new JwtSecurityToken(
        issuer: issuer,
        audience: audience,
        claims: claims,
        expires: DateTime.UtcNow.AddDays(expiryDays),
        signingCredentials: creds
    );
    return new JwtSecurityTokenHandler().WriteToken(token);
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

record GoogleSignInRequest(string IdToken);
record ItineraireUpsertRequest(string Nom, string DureeKey, string[][] Days);
