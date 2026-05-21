using Microsoft.EntityFrameworkCore;
using JiraClone.Data.Entities;

namespace JiraClone.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Project> Projects { get; set; } = null!;
        public DbSet<TaskItem> TaskItems { get; set; } = null!;
        public DbSet<Comment> Comments { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            });

            // Project configuration
            modelBuilder.Entity<Project>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Key).IsRequired().HasMaxLength(10);

                entity.HasOne(p => p.Owner)
                    .WithMany(u => u.OwnedProjects)
                    .HasForeignKey(p => p.OwnerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // TaskItem configuration
            modelBuilder.Entity<TaskItem>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(255);

                entity.HasOne(i => i.Project)
                    .WithMany(p => p.Tasks)
                    .HasForeignKey(i => i.ProjectId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(i => i.Assignee)
                    .WithMany(u => u.AssignedTasks)
                    .HasForeignKey(i => i.AssigneeId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(i => i.Reporter)
                    .WithMany(u => u.ReportedTasks)
                    .HasForeignKey(i => i.ReporterId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Comment configuration
            modelBuilder.Entity<Comment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Content).IsRequired();

                entity.HasOne(c => c.Author)
                    .WithMany(u => u.Comments)
                    .HasForeignKey(c => c.AuthorId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(c => c.TaskItem)
                    .WithMany(i => i.Comments)
                    .HasForeignKey(c => c.TaskItemId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }    }
}
