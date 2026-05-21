using System;
using System.Collections.Generic;

namespace JiraClone.Data.Entities
{
    public class TaskItem
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public TaskStatus Status { get; set; }
        public TaskPriority Priority { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public Guid ProjectId { get; set; }
        public Guid? AssigneeId { get; set; }
        public Guid ReporterId { get; set; }

        // Navigation properties
        public Project Project { get; set; } = null!;
        public User? Assignee { get; set; }
        public User Reporter { get; set; } = null!;
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    }
}
