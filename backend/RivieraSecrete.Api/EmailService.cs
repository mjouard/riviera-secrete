using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace RivieraSecrete.Api;

/// <summary>Envoi d'emails transactionnels via l'API HTTP de Resend (resend.com).</summary>
public static class EmailService
{
    private static readonly HttpClient Http = new() { BaseAddress = new Uri("https://api.resend.com/") };

    public static async Task SendConfirmationEmailAsync(string toEmail, string nom, string token, IConfiguration config)
    {
        var apiKey = config["Resend:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            Console.WriteLine("[EmailService] Resend:ApiKey non configuré — email de confirmation non envoyé.");
            return;
        }

        var fromEmail = config["Resend:FromEmail"] ?? "onboarding@resend.dev";
        var frontendUrl = config["Frontend:Url"] ?? "http://localhost:3000";
        var confirmUrl = $"{frontendUrl}/confirmer-email?token={Uri.EscapeDataString(token)}";

        var html = $"""
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
              <h2 style="color:#0C1116">Bienvenue sur Riviera Secrète, {WebEscape(nom)}</h2>
              <p style="color:#333">Confirme ton adresse email pour activer ton compte :</p>
              <p style="margin:24px 0">
                <a href="{confirmUrl}" style="background:#4FC3C9;color:#0C1116;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
                  Confirmer mon email
                </a>
              </p>
              <p style="color:#888;font-size:13px">Ce lien expire dans 24h. Si tu n'es pas à l'origine de cette inscription, ignore cet email.</p>
            </div>
            """;

        var payload = JsonSerializer.Serialize(new
        {
            from = $"Riviera Secrète <{fromEmail}>",
            to = new[] { toEmail },
            subject = "Confirme ton adresse email",
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
