namespace RivieraSecrete.Api;

record GoogleSignInRequest(string IdToken);
record RegisterRequest(string Email, string Password, string Nom);
record LoginRequest(string Email, string Password);
record ConfirmEmailRequest(string Token);
record ResendConfirmationRequest(string Email);
record ForgotPasswordRequest(string Email);
record ResetPasswordRequest(string Token, string Password);
record ItineraireUpsertRequest(string Nom, string DureeKey, string[][] Days);
record ItineraireComposeCreateRequest(string Nom, string DureeKey, string[][] Jours);
