using Microsoft.EntityFrameworkCore;
using JiraClone.Data.Domain.Entities;

namespace JiraClone.Data.Infrastructure.Db;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Goal> Goals => Set<Goal>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<Executor> Executors => Set<Executor>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<TimeEntry> TimeEntries => Set<TimeEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Goal -> Projects (1:M)
        modelBuilder.Entity<Goal>()
            .HasMany(g => g.Projects)
            .WithOne(p => p.Goal)
            .HasForeignKey(p => p.GoalId)
            .OnDelete(DeleteBehavior.Cascade);

        // Project -> Tasks (1:M)
        modelBuilder.Entity<Project>()
            .HasMany(p => p.Tasks)
            .WithOne(t => t.Project)
            .HasForeignKey(t => t.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        // Task -> Comments (1:M)
        modelBuilder.Entity<TaskItem>()
            .HasMany(t => t.Comments)
            .WithOne(c => c.TaskItem)
            .HasForeignKey(c => c.TaskItemId)
            .OnDelete(DeleteBehavior.Cascade);

        // Task -> TimeEntries (1:M)
        modelBuilder.Entity<TaskItem>()
            .HasMany(t => t.TimeEntries)
            .WithOne(te => te.TaskItem)
            .HasForeignKey(te => te.TaskItemId)
            .OnDelete(DeleteBehavior.Cascade);

        // Executor -> Tasks (1:M)
        modelBuilder.Entity<Executor>()
            .HasMany(e => e.Tasks)
            .WithOne(t => t.Executor)
            .HasForeignKey(t => t.ExecutorId)
            .OnDelete(DeleteBehavior.SetNull);

        // Executor -> Comments (1:M)
        modelBuilder.Entity<Executor>()
            .HasMany<Comment>()
            .WithOne(c => c.Author)
            .HasForeignKey(c => c.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        // Executor -> TimeEntries (1:M)
        modelBuilder.Entity<Executor>()
            .HasMany<TimeEntry>()
            .WithOne(te => te.Executor)
            .HasForeignKey(te => te.ExecutorId)
            .OnDelete(DeleteBehavior.Cascade);

        // Precision for decimal
        modelBuilder.Entity<TimeEntry>()
            .Property(te => te.Hours)
            .HasPrecision(18, 2);
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is BaseEntity && (e.State == EntityState.Added || e.State == EntityState.Modified));

        foreach (var entry in entries)
        {
            ((BaseEntity)entry.Entity).UpdatedAt = DateTime.UtcNow;
            if (entry.State == EntityState.Added)
            {
                ((BaseEntity)entry.Entity).CreatedAt = DateTime.UtcNow;
            }
        }
    }
}
