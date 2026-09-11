namespace RivieraSecrete.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string GoogleId { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string Nom { get; set; } = default!;
    public DateTime CreatedAt { get; set; }

    public ICollection<UserFavorite> Favorites { get; set; } = [];
    public ICollection<UserItineraire> Itineraires { get; set; } = [];
}
