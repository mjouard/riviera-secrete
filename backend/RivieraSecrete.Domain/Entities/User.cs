namespace RivieraSecrete.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string? GoogleId { get; set; }
    public string? PasswordHash { get; set; }
    public string Email { get; set; } = default!;
    public string Nom { get; set; } = default!;
    public bool EmailConfirmed { get; set; }
    public string? EmailConfirmationToken { get; set; }
    public DateTime? EmailConfirmationTokenExpiry { get; set; }

    /// <summary>Jeton de réinitialisation de mot de passe, à usage unique. Null hors demande
    /// en cours. Distinct du jeton de confirmation : les deux peuvent coexister, et les
    /// confondre permettrait de confirmer une adresse en réinitialisant un mot de passe.</summary>
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetTokenExpiry { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<UserFavorite> Favorites { get; set; } = [];
    public ICollection<UserItineraire> Itineraires { get; set; } = [];
}
