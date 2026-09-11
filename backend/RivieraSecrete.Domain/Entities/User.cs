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
    public DateTime CreatedAt { get; set; }

    public ICollection<UserFavorite> Favorites { get; set; } = [];
    public ICollection<UserItineraire> Itineraires { get; set; } = [];
}
