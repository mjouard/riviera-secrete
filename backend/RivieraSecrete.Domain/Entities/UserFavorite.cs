namespace RivieraSecrete.Domain.Entities;

public class UserFavorite
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string LieuSlug { get; set; } = default!;
    public DateTime CreatedAt { get; set; }

    public User User { get; set; } = default!;
}
