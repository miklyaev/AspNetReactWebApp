using System;

namespace JiraClone.Data.Entities
{
    public class Comment
    {
        public Guid Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public Guid AuthorId { get; set; }
        public Guid TaskItemId { get; set; }

        // Navigation properties
        public User Author { get; set; } = null!;
        public TaskItem TaskItem { get; set; } = null!;
    }
}
