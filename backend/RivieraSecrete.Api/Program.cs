using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RivieraSecrete.Api;
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
// Un secret vide signerait et accepterait des tokens avec une clé vide, donc forgeables par
// n'importe qui : on refuse de démarrer plutôt que de tourner dans cet état.
var jwtSecret = builder.Configuration["Jwt:Secret"];
if (string.IsNullOrWhiteSpace(jwtSecret))
    throw new InvalidOperationException(
        "Jwt:Secret n'est pas configuré (variable d'environnement Jwt__Secret) — démarrage refusé.");
if (Encoding.UTF8.GetByteCount(jwtSecret) < 32)
    Console.WriteLine("[Auth] ATTENTION : Jwt:Secret fait moins de 32 octets — HMAC-SHA256 attend une clé d'au moins 256 bits.");

var jwtIssuer = builder.Configuration["Jwt:Issuer"]!;
var jwtAudience = builder.Configuration["Jwt:Audience"]!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.MapInboundClaims = false; // conserve "sub" tel quel, évite le mapping vers ClaimTypes.NameIdentifier
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

// ── Rate limiting sur les endpoints d'auth ────────────────────────────────────
// Sans ça, /login est brute-forçable sans limite et /register + /resend-confirmation
// permettent d'inonder la base de comptes et de faire envoyer des emails en masse depuis
// notre domaine Resend. Deux politiques : une générale pour les endpoints qui ne font que
// vérifier des identifiants, une plus stricte pour ceux qui déclenchent un envoi d'email.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (ctx, ct) =>
    {
        if (ctx.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
            ctx.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();
        await ctx.HttpContext.Response.WriteAsJsonAsync(
            new { Error = "Trop de tentatives. Réessaie dans quelques minutes.", Code = "trop_de_tentatives" }, ct);
    };

    options.AddPolicy("auth", ctx => RateLimitPartition.GetFixedWindowLimiter(
        ClientKey(ctx),
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(1) }));

    options.AddPolicy("auth-email", ctx => RateLimitPartition.GetFixedWindowLimiter(
        ClientKey(ctx),
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(15) }));
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseCors();
app.UseRateLimiter();
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

// ── Public: Itinéraires composés (lot 4d, ROADMAP.md) ─────────────────────────
// Un itinéraire composé sans compte, lisible par quiconque a le lien /i/{id} — jamais
// l'EditToken, qui reste réservé à PATCH/DELETE (voir plus bas, section protégée).

app.MapGet("/api/itineraires-composes/{id}", async (string id, AppDbContext db) =>
    await db.ItinerairesComposes.FirstOrDefaultAsync(i => i.Id == id)
    is { } itin
        ? Results.Ok(new
        {
            itin.Id,
            itin.Nom,
            itin.DureeKey,
            itin.Jours,
            itin.CreatedAt,
            itin.VisibiliteLien,
        })
        : Results.NotFound());

app.MapPost("/api/itineraires-composes", async (ItineraireComposeCreateRequest req, ClaimsPrincipal principal, AppDbContext db) =>
{
    if (ValiderItineraireCompose(req) is { } erreur) return Results.BadRequest(new { Error = erreur });

    // Le Bearer, s'il est présent et valide, est déjà résolu dans `principal` ici — pas besoin
    // de RequireAuthorization pour ça : cet endpoint reste utilisable sans compte, mais un
    // visiteur connecté au moment du POST se voit rattacher l'itinéraire (autorise alors
    // PATCH/DELETE via son propre JWT, en plus de l'EditToken — voir ItineraireCompose.cs).
    var userId = GetUserId(principal);

    var id = await GenerateUniqueShortIdAsync(db);
    var itin = new ItineraireCompose
    {
        Id = id,
        EditToken = GenerateToken(),
        Nom = req.Nom.Trim(),
        DureeKey = req.DureeKey,
        Jours = req.Jours,
        CreatedAt = DateTime.UtcNow,
        UserId = userId,
    };
    db.ItinerairesComposes.Add(itin);
    await db.SaveChangesAsync();

    return Results.Created($"/api/itineraires-composes/{itin.Id}", new { itin.Id, itin.EditToken });
}).RequireRateLimiting("auth");

// ── Auth ──────────────────────────────────────────────────────────────────────
// Chaque erreur porte un `Code` machine en plus de son `Error` en français. Le frontend est
// bilingue, le backend ne l'est pas : afficher `Error` tel quel mettait des phrases
// françaises sur /en. Le message reste utile aux appels directs (curl, journaux) ; c'est le
// `Code` que l'interface traduit. Ajouter un code ici sans sa traduction côté frontend fait
// simplement retomber sur un message générique, jamais sur du français.

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

    // Google peut émettre un id_token valide pour un compte dont l'email n'est pas vérifié
    // (certains comptes Workspace). Sans ce contrôle, un tel token suffirait à se lier
    // automatiquement (ci-dessous) sur un compte email/mot de passe existant qui porte la
    // même adresse — donc à en prendre le contrôle. On refuse.
    if (string.IsNullOrWhiteSpace(payload.Email) || payload.EmailVerified != true)
        return Results.Unauthorized();

    var email = payload.Email.Trim().ToLowerInvariant();
    if (email.Length > 256)
        return Results.Unauthorized();
    // Colonne Nom limitée à 200 : on tronque plutôt que de laisser l'INSERT partir en 500.
    var nomGoogle = (payload.Name ?? email) is { Length: > 200 } trop ? trop[..200] : payload.Name ?? email;

    var user = await db.Users.FirstOrDefaultAsync(u => u.GoogleId == payload.Subject);
    if (user is null)
    {
        // Un compte existe peut-être déjà avec cet email (inscription par mot de passe) — on lie
        // le GoogleId dessus plutôt que de créer un doublon (Email est unique en base).
        user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is not null)
        {
            user.GoogleId = payload.Subject;
        }
        else
        {
            user = new User
            {
                GoogleId = payload.Subject,
                Email = email,
                Nom = nomGoogle,
                EmailConfirmed = true, // Google a déjà vérifié la propriété de l'email
            };
            db.Users.Add(user);
        }
        // Google vouche pour cet email, y compris pour un compte email/mdp existant qu'on lie ici.
        user.EmailConfirmed = true;
        await db.SaveChangesAsync();
    }

    var token = GenerateJwt(user, config);
    return Results.Ok(new { Token = token, User = new { user.Id, user.Email, user.Nom } });
}).RequireRateLimiting("auth");

app.MapPost("/api/auth/register", async (RegisterRequest req, AppDbContext db, IConfiguration config) =>
{
    // Les champs d'un record ne sont pas validés par le binder : un JSON sans clé (ou avec
    // null) arrive ici en null et faisait planter le .Trim() en 500. Les bornes de longueur
    // reprennent celles des colonnes (Email 256 / Nom 200) : sans elles, une chaîne plus
    // longue passait la validation puis faisait échouer l'INSERT en 500.
    var email = (req.Email ?? "").Trim().ToLowerInvariant();
    var nom = (req.Nom ?? "").Trim();
    var password = req.Password ?? "";

    if (string.IsNullOrWhiteSpace(email) || !email.Contains('@') || email.Length > 256)
        return Results.BadRequest(new { Error = "Adresse email invalide.", Code = "email_invalide" });
    if (string.IsNullOrWhiteSpace(nom) || nom.Length > 200)
        return Results.BadRequest(new { Error = "Le nom est requis (200 caractères maximum).", Code = "nom_requis" });
    if (password.Length < 8)
        return Results.BadRequest(new { Error = "Le mot de passe doit faire au moins 8 caractères.", Code = "trop_court" });
    // BCrypt ne considère que les 72 premiers octets ; au-delà on refuse plutôt que de
    // tronquer silencieusement, et ça borne le coût du hachage.
    if (Encoding.UTF8.GetByteCount(password) > 72)
        return Results.BadRequest(new { Error = "Le mot de passe ne doit pas dépasser 72 octets.", Code = "trop_long" });

    if (await db.Users.AnyAsync(u => u.Email == email))
        return Results.Conflict(new { Error = "Un compte existe déjà avec cet email.", Code = "email_deja_pris" });

    var user = new User
    {
        Email = email,
        Nom = nom,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
        EmailConfirmed = false,
        EmailConfirmationToken = GenerateToken(),
        EmailConfirmationTokenExpiry = DateTime.UtcNow.AddHours(24),
    };
    db.Users.Add(user);
    await db.SaveChangesAsync();

    await EmailService.SendConfirmationEmailAsync(user.Email, user.Nom, user.EmailConfirmationToken!, config);

    return Results.Ok(new { Status = "confirmation_required", Email = user.Email });
}).RequireRateLimiting("auth-email");

app.MapPost("/api/auth/login", async (LoginRequest req, AppDbContext db, IConfiguration config) =>
{
    var email = (req.Email ?? "").Trim().ToLowerInvariant();
    var password = req.Password ?? "";
    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);

    // On vérifie toujours un hash, même quand le compte n'existe pas (ou n'a pas de mot de
    // passe, cas d'un compte Google pur) : sinon la réponse revient en ~1 ms au lieu des
    // ~100 ms d'un BCrypt, et cet écart suffit à énumérer les comptes existants.
    var hashToCheck = user?.PasswordHash ?? DummyHash.Value;
    var passwordOk = BCrypt.Net.BCrypt.Verify(password, hashToCheck);

    if (user is null || user.PasswordHash is null || !passwordOk)
        return Results.Json(new { Error = "Email ou mot de passe incorrect.", Code = "identifiants_invalides" }, statusCode: 401);
    if (!user.EmailConfirmed)
        return Results.Json(new { Error = "Confirme ton email avant de te connecter.", Code = "email_not_confirmed" }, statusCode: 403);

    var token = GenerateJwt(user, config);
    return Results.Ok(new { Token = token, User = new { user.Id, user.Email, user.Nom } });
}).RequireRateLimiting("auth");

app.MapPost("/api/auth/confirm-email", async (ConfirmEmailRequest req, AppDbContext db, IConfiguration config) =>
{
    // Un token null se traduirait par un `WHERE "EmailConfirmationToken" IS NULL` côté EF,
    // qui matche tous les comptes déjà confirmés. L'expiry null les sauve aujourd'hui, mais
    // la requête n'a aucune raison d'être exécutée : on refuse en amont.
    if (string.IsNullOrWhiteSpace(req.Token))
        return Results.BadRequest(new { Error = "Lien de confirmation invalide.", Code = "token_invalide" });

    var user = await db.Users.FirstOrDefaultAsync(u => u.EmailConfirmationToken == req.Token);
    if (user is null)
        return Results.BadRequest(new { Error = "Lien de confirmation invalide.", Code = "token_invalide" });
    if (user.EmailConfirmationTokenExpiry is null || user.EmailConfirmationTokenExpiry < DateTime.UtcNow)
        return Results.BadRequest(new { Error = "Ce lien de confirmation a expiré. Demande-en un nouveau.", Code = "token_expire" });

    user.EmailConfirmed = true;
    user.EmailConfirmationToken = null;
    user.EmailConfirmationTokenExpiry = null;
    await db.SaveChangesAsync();

    return Results.Ok(new { Status = "confirmed" });
}).RequireRateLimiting("auth");

app.MapPost("/api/auth/resend-confirmation", async (ResendConfirmationRequest req, AppDbContext db, IConfiguration config) =>
{
    var email = (req.Email ?? "").Trim().ToLowerInvariant();
    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);

    // Réponse générique dans tous les cas pour ne pas révéler si l'email existe.
    if (user is not null && user.PasswordHash is not null && !user.EmailConfirmed)
    {
        user.EmailConfirmationToken = GenerateToken();
        user.EmailConfirmationTokenExpiry = DateTime.UtcNow.AddHours(24);
        await db.SaveChangesAsync();
        await EmailService.SendConfirmationEmailAsync(user.Email, user.Nom, user.EmailConfirmationToken!, config);
    }

    return Results.Ok(new { Status = "sent" });
}).RequireRateLimiting("auth-email");

app.MapPost("/api/auth/forgot-password", async (ForgotPasswordRequest req, AppDbContext db, IConfiguration config) =>
{
    var email = (req.Email ?? "").Trim().ToLowerInvariant();
    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);

    // Réponse générique dans tous les cas, comme pour resend-confirmation : distinguer
    // « adresse inconnue » de « email envoyé » transformerait cet endpoint en oracle
    // d'existence de comptes, que le 409 de register expose déjà bien assez.
    if (user is not null)
    {
        // Un compte créé uniquement via Google n'a pas de mot de passe à réinitialiser.
        // On n'envoie rien plutôt que de proposer un lien qui ne mènerait nulle part.
        if (user.PasswordHash is not null)
        {
            user.PasswordResetToken = GenerateToken();
            // 1h et non 24h comme la confirmation : un lien de réinitialisation est une clé
            // d'accès au compte, il n'a pas à survivre dans une boîte mail.
            user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
            await db.SaveChangesAsync();
            await EmailService.SendPasswordResetEmailAsync(user.Email, user.Nom, user.PasswordResetToken!, config);
        }
    }

    return Results.Ok(new { Status = "sent" });
}).RequireRateLimiting("auth-email");

app.MapPost("/api/auth/reset-password", async (ResetPasswordRequest req, AppDbContext db, IConfiguration config) =>
{
    // Même garde que confirm-email : un token null se traduirait par un
    // `WHERE "PasswordResetToken" IS NULL`, qui matche tous les comptes sans demande en cours.
    // Un `Code` machine accompagne chaque erreur : le frontend est bilingue, le backend ne
    // l'est pas, et afficher tel quel un message français sur /en est exactement le défaut
    // qu'on vient de corriger partout ailleurs.
    if (string.IsNullOrWhiteSpace(req.Token))
        return Results.BadRequest(new { Error = "Lien de réinitialisation invalide.", Code = "token_invalide" });

    var password = req.Password ?? "";
    if (password.Length < 8)
        return Results.BadRequest(new { Error = "Le mot de passe doit faire au moins 8 caractères.", Code = "trop_court" });
    if (Encoding.UTF8.GetByteCount(password) > 72)
        return Results.BadRequest(new { Error = "Le mot de passe ne doit pas dépasser 72 octets.", Code = "trop_long" });

    var user = await db.Users.FirstOrDefaultAsync(u => u.PasswordResetToken == req.Token);
    if (user is null)
        return Results.BadRequest(new { Error = "Lien de réinitialisation invalide.", Code = "token_invalide" });
    if (user.PasswordResetTokenExpiry < DateTime.UtcNow)
        return Results.BadRequest(new { Error = "Ce lien a expiré. Redemande une réinitialisation.", Code = "token_expire" });

    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
    user.PasswordResetToken = null;
    user.PasswordResetTokenExpiry = null;
    // Recevoir le mail prouve la possession de l'adresse : un compte resté non confirmé
    // devient confirmé ici, sinon on l'enverrait réinitialiser puis buter sur un 403.
    user.EmailConfirmed = true;
    user.EmailConfirmationToken = null;
    user.EmailConfirmationTokenExpiry = null;
    await db.SaveChangesAsync();

    // Pas de JWT en retour : on renvoie vers la page de connexion, pour que le nouveau mot
    // de passe soit saisi une fois de plus et que l'utilisateur reparte d'un état connu.
    return Results.Ok(new { Status = "reset" });
}).RequireRateLimiting("auth");

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
    // Sans borne, un slug de plus de 100 caractères faisait échouer l'INSERT en 500 ; sans
    // vérification d'existence, un compte authentifié pouvait remplir la table de slugs
    // arbitraires (l'index unique est sur (UserId, LieuSlug), donc rien ne l'en empêchait).
    if (!EstSlugValide(lieuSlug))
        return Results.BadRequest(new { Error = "Slug de lieu invalide.", Code = "slug_invalide" });
    if (!await db.Lieux.AnyAsync(l => l.Slug == lieuSlug))
        return Results.NotFound(new { Error = "Lieu inconnu.", Code = "lieu_inconnu" });

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
    if (ValiderItineraire(req) is { } erreur) return Results.BadRequest(new { Error = erreur });
    // Borne le nombre d'itinéraires par compte : rien n'empêchait un compte authentifié d'en
    // créer en boucle jusqu'à saturer la base.
    if (await db.UserItineraires.CountAsync(i => i.UserId == userId) >= Limites.MaxItinerairesParUtilisateur)
        return Results.BadRequest(new { Error = $"Limite de {Limites.MaxItinerairesParUtilisateur} itinéraires atteinte." });

    var itin = new UserItineraire
    {
        UserId = userId.Value,
        Nom = req.Nom.Trim(),
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
    if (ValiderItineraire(req) is { } erreur) return Results.BadRequest(new { Error = erreur });
    var itin = await db.UserItineraires.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
    if (itin is null) return Results.NotFound();
    itin.Nom = req.Nom.Trim();
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

/// <summary>
/// Clé de partitionnement du rate limiter : l'IP réelle du client.
/// Derrière le proxy Railway, <c>RemoteIpAddress</c> est celle du proxy (identique pour tout
/// le monde), donc on lit X-Forwarded-For et on prend la **première** entrée.
///
/// Attention au contre-sens : la règle générale « un client peut spoofer le début de la
/// chaîne, donc prends la fin » ne s'applique pas ici. L'edge Railway *supprime* le
/// X-Forwarded-For envoyé par le client avant d'écrire le sien, donc la première entrée est
/// toujours l'IP réelle et n'est pas contrôlable par l'appelant. Railway peut par ailleurs
/// ajouter un second hop interne : prendre la dernière entrée renverrait alors l'IP du proxy,
/// identique pour tout le monde — un seul quota partagé par tous les visiteurs, qui
/// transformerait le rate limiter en déni de service (20 requêtes/min suffiraient à bloquer
/// les connexions de tout le site). Fallback sur RemoteIpAddress en local, sans l'en-tête.
/// </summary>
static string ClientKey(HttpContext ctx)
{
    var forwarded = ctx.Request.Headers["X-Forwarded-For"].ToString();
    if (!string.IsNullOrWhiteSpace(forwarded))
    {
        var hops = forwarded.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (hops.Length > 0) return hops[0];
    }
    return ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}

/// <summary>Slugs du site : minuscules, chiffres et tirets, jamais plus de 100 caractères
/// (taille de la colonne <c>UserFavorite.LieuSlug</c>).</summary>
static bool EstSlugValide(string? slug) =>
    !string.IsNullOrEmpty(slug)
    && slug.Length <= 100
    && slug.All(c => (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-');

/// <summary>
/// Valide le payload d'un itinéraire personnalisé. Retourne le message d'erreur, ou null si
/// tout est bon. Sans ces bornes, le champ <c>Days</c> (jsonb, aucune limite de taille) et
/// les chaînes plus longues que leurs colonnes permettaient à un compte authentifié soit de
/// stocker des mégaoctets arbitraires, soit de provoquer un 500 à l'INSERT.
/// </summary>
static string? ValiderItineraire(ItineraireUpsertRequest req)
{
    var nom = (req.Nom ?? "").Trim();
    if (string.IsNullOrWhiteSpace(nom) || nom.Length > 200)
        return "Le nom de l'itinéraire est requis (200 caractères maximum).";
    if (string.IsNullOrWhiteSpace(req.DureeKey) || req.DureeKey.Length > 20)
        return "Durée invalide.";
    if (req.Days is null)
        return "Le programme est requis.";
    if (req.Days.Length > Limites.MaxJours)
        return $"Un itinéraire ne peut pas dépasser {Limites.MaxJours} jours.";
    if (req.Days.Any(j => j is null))
        return "Le programme contient un jour invalide.";
    if (req.Days.Sum(j => j.Length) > Limites.MaxEtapes)
        return $"Un itinéraire ne peut pas dépasser {Limites.MaxEtapes} étapes.";
    if (req.Days.SelectMany(j => j).Any(s => !EstSlugValide(s)))
        return "Le programme contient un slug de lieu invalide.";
    return null;
}

static string GenerateToken()
{
    var bytes = System.Security.Cryptography.RandomNumberGenerator.GetBytes(32);
    return Convert.ToHexString(bytes).ToLowerInvariant();
}

/// <summary>
/// Valide le payload de création d'un itinéraire composé. Mêmes bornes que
/// <see cref="ValiderItineraire"/> (même forme de données, Days ↔ Jours) — un visiteur sans
/// compte peut appeler cet endpoint sans aucune limite de fréquence, donc sans ces bornes
/// <c>Jours</c> (jsonb, aucune limite de taille en base) permettrait de stocker des
/// mégaoctets arbitraires par requête.
/// </summary>
static string? ValiderItineraireCompose(ItineraireComposeCreateRequest req)
{
    var nom = (req.Nom ?? "").Trim();
    if (string.IsNullOrWhiteSpace(nom) || nom.Length > 200)
        return "Le nom de l'itinéraire est requis (200 caractères maximum).";
    if (string.IsNullOrWhiteSpace(req.DureeKey) || req.DureeKey.Length > 20)
        return "Durée invalide.";
    if (req.Jours is null)
        return "Le programme est requis.";
    if (req.Jours.Length > Limites.MaxJours)
        return $"Un itinéraire ne peut pas dépasser {Limites.MaxJours} jours.";
    if (req.Jours.Any(j => j is null))
        return "Le programme contient un jour invalide.";
    if (req.Jours.Sum(j => j.Length) > Limites.MaxEtapes)
        return $"Un itinéraire ne peut pas dépasser {Limites.MaxEtapes} étapes.";
    if (req.Jours.SelectMany(j => j).Any(s => !EstSlugValide(s)))
        return "Le programme contient un slug de lieu invalide.";
    return null;
}

/// <summary>
/// Alphabet sans caractères ambigus (pas de 0/O/1/l/I) — l'id apparaît dans une URL partagée
/// à la main (/i/{id}), autant éviter les confusions à la relecture/retranscription.
/// 12 caractères sur cet alphabet de 57 donnent ~70 bits d'entropie : largement assez pour
/// rester non devinable sans être interminable dans l'URL.
/// </summary>
const string ShortIdAlphabet = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
const int ShortIdLength = 12;

static string GenerateShortId()
{
    var bytes = System.Security.Cryptography.RandomNumberGenerator.GetBytes(ShortIdLength);
    var chars = new char[ShortIdLength];
    for (var i = 0; i < ShortIdLength; i++)
        chars[i] = ShortIdAlphabet[bytes[i] % ShortIdAlphabet.Length];
    return new string(chars);
}

/// <summary>Génère un id court et retire les collisions (négligeables à cette entropie, mais
/// gratuites à exclure) plutôt que de laisser l'INSERT échouer sur la clé primaire.</summary>
static async Task<string> GenerateUniqueShortIdAsync(AppDbContext db)
{
    for (var attempt = 0; attempt < 5; attempt++)
    {
        var id = GenerateShortId();
        if (!await db.ItinerairesComposes.AnyAsync(i => i.Id == id))
            return id;
    }
    throw new InvalidOperationException("Impossible de générer un id unique pour l'itinéraire composé.");
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
record RegisterRequest(string Email, string Password, string Nom);
record LoginRequest(string Email, string Password);
record ConfirmEmailRequest(string Token);
record ResendConfirmationRequest(string Email);
record ForgotPasswordRequest(string Email);
record ResetPasswordRequest(string Token, string Password);
record ItineraireUpsertRequest(string Nom, string DureeKey, string[][] Days);
record ItineraireComposeCreateRequest(string Nom, string DureeKey, string[][] Jours);
record ItineraireComposeUpdateRequest(string Nom, string DureeKey, string[][] Jours);

// ── Constantes & helpers de type ──────────────────────────────────────────────

/// <summary>Bornes appliquées aux payloads des endpoints protégés. Le générateur côté
/// frontend produit au plus 3 jours et une poignée d'étapes : ces valeurs laissent de la
/// marge tout en empêchant qu'un compte authentifié stocke des volumes arbitraires.</summary>
static class Limites
{
    public const int MaxJours = 10;
    public const int MaxEtapes = 200;
    public const int MaxItinerairesParUtilisateur = 100;
}

/// <summary>Hash BCrypt d'un mot de passe aléatoire, jamais connu de personne. Sert
/// uniquement à faire travailler BCrypt au login quand le compte n'existe pas, pour que le
/// temps de réponse ne trahisse pas l'existence d'un compte.</summary>
static class DummyHash
{
    public static readonly string Value = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString());
}
