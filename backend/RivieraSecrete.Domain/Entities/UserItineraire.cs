namespace RivieraSecrete.Domain.Entities;

public class UserItineraire
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Nom { get; set; } = default!;
    public string DureeKey { get; set; } = default!;
    public string[][] Days { get; set; } = [];
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User User { get; set; } = default!;
}
