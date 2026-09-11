using Microsoft.EntityFrameworkCore;
using RivieraSecrete.Domain.Entities;

namespace RivieraSecrete.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Lieu> Lieux => Set<Lieu>();
    public DbSet<Activite> Activites => Set<Activite>();
    public DbSet<Ville> Villes => Set<Ville>();
    public DbSet<Itineraire> Itineraires => Set<Itineraire>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
