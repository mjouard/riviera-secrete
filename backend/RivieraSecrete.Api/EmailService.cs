using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace RivieraSecrete.Api;

/// <summary>
/// Envoi d'emails transactionnels via l'API HTTP de Resend (resend.com).
///
/// Les échecs sont journalisés et avalés, jamais relancés : une panne Resend ne doit pas
/// faire échouer une inscription ni révéler, par un code d'erreur, qu'une adresse existe.
/// Le visiteur peut toujours redemander l'envoi une fois le service revenu.
/// </summary>
public static class EmailService
{
    private static readonly HttpClient Http = new() { BaseAddress = new Uri("https://api.resend.com/") };

    public static Task SendConfirmationEmailAsync(string toEmail, string nom, string token, IConfiguration config)
    {
        var url = $"{FrontendUrl(config)}/confirmer-email?token={Uri.EscapeDataString(token)}";
        return EnvoyerAsync(
            config,
            toEmail,
            sujet: "Confirme ton adresse email",
            html: Gabarit(
                titre: $"Bienvenue sur Riviera Secrète, {WebEscape(nom)}",
                phrase: "Confirme ton adresse email pour activer ton compte :",
                bouton: "Confirmer mon email",
                url: url,
                pied: "Ce lien expire dans 24h. Si tu n'es pas à l'origine de cette inscription, ignore cet email."));
    }

    public static Task SendPasswordResetEmailAsync(string toEmail, string nom, string token, IConfiguration config)
    {
        var url = $"{FrontendUrl(config)}/reinitialiser-mot-de-passe?token={Uri.EscapeDataString(token)}";
        return EnvoyerAsync(
            config,
            toEmail,
            sujet: "Réinitialise ton mot de passe",
            html: Gabarit(
                titre: $"Nouveau mot de passe, {WebEscape(nom)} ?",
                phrase: "Clique ci-dessous pour en choisir un nouveau :",
                bouton: "Choisir un nouveau mot de passe",
                url: url,
                // Durée courte, et on le dit : un lien de réinitialisation qui traîne dans une
                // boîte mail est une clé d'accès au compte.
                pied: "Ce lien expire dans 1h et ne fonctionne qu'une fois. Si tu n'as rien demandé, "
                    + "ignore cet email : ton mot de passe actuel reste valable."));
    }

    private static string FrontendUrl(IConfiguration config) =>
        config["Frontend:Url"] ?? "http://localhost:3000";

    private static string Gabarit(string titre, string phrase, string bouton, string url, string pied) => $"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#0C1116">{titre}</h2>
          <p style="color:#333">{phrase}</p>
          <p style="margin:24px 0">
            <a href="{url}" style="background:#4FC3C9;color:#0C1116;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
              {bouton}
            </a>
          </p>
          <p style="color:#888;font-size:13px">{pied}</p>
        </div>
        """;

    private static async Task EnvoyerAsync(IConfiguration config, string toEmail, string sujet, string html)
    {
        var apiKey = config["Resend:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            Console.WriteLine($"[EmailService] Resend:ApiKey non configuré — email « {sujet} » non envoyé.");
            return;
        }

        var fromEmail = config["Resend:FromEmail"] ?? "onboarding@resend.dev";
        var payload = JsonSerializer.Serialize(new
        {
            from = $"Riviera Secrète <{fromEmail}>",
            to = new[] { toEmail },
            subject = sujet,
            html,
        });

        using var req = new HttpRequestMessage(HttpMethod.Post, "emails")
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json"),
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        try
        {
            var res = await Http.SendAsync(req);
            if (!res.IsSuccessStatusCode)
            {
                var body = await res.Content.ReadAsStringAsync();
                Console.WriteLine($"[EmailService] Échec envoi Resend ({res.StatusCode}): {body}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EmailService] Exception envoi email: {ex.Message}");
        }
    }

    private static string WebEscape(string s) => System.Net.WebUtility.HtmlEncode(s);
}
