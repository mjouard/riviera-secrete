using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RivieraSecrete.Domain.Entities;
using RivieraSecrete.Infrastructure.Data;

namespace RivieraSecrete.Api;

internal static class Helpers
{
    // ── Auth ──────────────────────────────────────────────────────────────────

    public static Guid? GetUserId(ClaimsPrincipal principal)
    {
        var sub = principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    /// <summary>
    /// Autorise le PATCH/DELETE d'un itinéraire composé : soit le JWT (<c>sub</c>) correspond
    /// au propriétaire (<see cref="ItineraireCompose.UserId"/>), soit le header
    /// <c>X-Edit-Token</c> correspond à l'<see cref="ItineraireCompose.EditToken"/> généré à
    /// la création. Un itinéraire créé par un visiteur sans compte (UserId null) ne peut donc
    /// être modifié que via l'EditToken — aucun JWT ne peut jamais matcher un UserId null.
    /// </summary>
    public static bool EstAutoriseSurItineraireCompose(ItineraireCompose itin, ClaimsPrincipal principal, HttpRequest request)
    {
        var userId = GetUserId(principal);
        if (userId is not null && itin.UserId == userId) return true;
        var editToken = request.Headers["X-Edit-Token"].ToString();
        if (string.IsNullOrEmpty(editToken)) return false;
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(editToken),
            Encoding.UTF8.GetBytes(itin.EditToken));
    }

    /// <summary>
    /// Clé de partitionnement du rate limiter : l'IP réelle du client.
    /// Derrière le proxy Railway, <c>RemoteIpAddress</c> est celle du proxy (identique pour tout
    /// le monde), donc on lit X-Forwarded-For et on prend la <b>première</b> entrée.
    ///
    /// L'edge Railway supprime le X-Forwarded-For envoyé par le client avant d'écrire le sien,
    /// donc la première entrée est toujours l'IP réelle. Prendre la dernière renverrait l'IP du
    /// proxy interne — un seul quota partagé par tout le site (déni de service).
    /// </summary>
    public static string ClientKey(HttpContext ctx)
    {
        var forwarded = ctx.Request.Headers["X-Forwarded-For"].ToString();
        if (!string.IsNullOrWhiteSpace(forwarded))
        {
            var hops = forwarded.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (hops.Length > 0) return hops[0];
        }
        return ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    // ── Validation ────────────────────────────────────────────────────────────

    /// <summary>Slugs du site : minuscules, chiffres et tirets, jamais plus de 100 caractères
    /// (taille de la colonne <c>UserFavorite.LieuSlug</c>).</summary>
    public static bool EstSlugValide(string? slug) =>
        !string.IsNullOrEmpty(slug)
        && slug.Length <= 100
        && slug.All(c => (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-');

    /// <summary>
    /// Valide le payload d'un itinéraire personnalisé. Sans ces bornes, <c>Days</c> (jsonb)
    /// et les chaînes plus longues que leurs colonnes permettaient de stocker des mégaoctets
    /// ou de provoquer un 500 à l'INSERT.
    /// </summary>
    public static string? ValiderItineraire(ItineraireUpsertRequest req)
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

    /// <summary>
    /// Valide le payload d'un itinéraire composé. Mêmes bornes que
    /// <see cref="ValiderItineraire"/> — un visiteur sans compte peut appeler cet endpoint sans
    /// limite de fréquence, donc <c>Jours</c> (jsonb) permettrait de stocker des mégaoctets par
    /// requête sans ces vérifications.
    /// </summary>
    public static string? ValiderItineraireCompose(ItineraireComposeCreateRequest req)
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

    // ── Token & JWT ───────────────────────────────────────────────────────────

    public static string GenerateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    /// <summary>
    /// Alphabet sans caractères ambigus (pas de 0/O/1/l/I) — l'id apparaît dans une URL partagée
    /// à la main (/i/{id}), autant éviter les confusions à la relecture/retranscription.
    /// 12 caractères sur cet alphabet de 57 donnent ~70 bits d'entropie.
    /// </summary>
    public const string ShortIdAlphabet = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
    public const int ShortIdLength = 12;

    public static string GenerateShortId()
    {
        var bytes = RandomNumberGenerator.GetBytes(ShortIdLength);
        var chars = new char[ShortIdLength];
        for (var i = 0; i < ShortIdLength; i++)
            chars[i] = ShortIdAlphabet[bytes[i] % ShortIdAlphabet.Length];
        return new string(chars);
    }

    /// <summary>Génère un id court unique, retirant les collisions plutôt que de laisser
    /// l'INSERT échouer sur la clé primaire.</summary>
    public static async Task<string> GenerateUniqueShortIdAsync(AppDbContext db)
    {
        for (var attempt = 0; attempt < 5; attempt++)
        {
            var id = GenerateShortId();
            if (!await db.ItinerairesComposes.AnyAsync(i => i.Id == id))
                return id;
        }
        throw new InvalidOperationException("Impossible de générer un id unique pour l'itinéraire composé.");
    }

    public static string GenerateJwt(User user, IConfiguration config)
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

    // ── Constantes ────────────────────────────────────────────────────────────

    /// <summary>Bornes appliquées aux payloads des endpoints protégés. Le générateur côté
    /// frontend produit au plus 3 jours et une poignée d'étapes : ces valeurs laissent de la
    /// marge tout en empêchant qu'un compte authentifié stocke des volumes arbitraires.</summary>
    public static class Limites
    {
        public const int MaxJours = 10;
        public const int MaxEtapes = 200;
        public const int MaxItinerairesParUtilisateur = 100;
    }

    /// <summary>Hash BCrypt d'un mot de passe aléatoire, jamais connu de personne. Sert
    /// uniquement à faire travailler BCrypt au login quand le compte n'existe pas, pour que le
    /// temps de réponse ne trahisse pas l'existence d'un compte.</summary>
    public static class DummyHash
    {
        public static readonly string Value = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString());
    }
}
