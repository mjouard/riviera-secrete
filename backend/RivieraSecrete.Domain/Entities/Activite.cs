namespace RivieraSecrete.Domain.Entities;

public class Activite
{
    public int Id { get; set; }
    public string ActiviteId { get; set; } = default!; // slug-style id from JSON
    public string Nom { get; set; } = default!;
    public string Badge { get; set; } = default!; // "gratuit" | "payant"
    public string Duree { get; set; } = default!;
    public string Prix { get; set; } = default!;
    public string Url { get; set; } = default!;
    public string Image { get; set; } = default!;
    public string Alt { get; set; } = default!;
    public string LinkText { get; set; } = default!;

    // FK
    public int LieuId { get; set; }
    public Lieu Lieu { get; set; } = default!;
}
