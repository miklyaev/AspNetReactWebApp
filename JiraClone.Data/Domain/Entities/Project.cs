using JiraClone.Data.Domain.Interfaces;

namespace JiraClone.Data.Domain.Entities;

public class Project : BaseEntity, IProject
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int GoalId { get; set; }
    public virtual Goal? Goal { get; set; }

    public virtual ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();

    public decimal Progress => Tasks.Any()
        ? (decimal)Tasks.Count(t => t.Status == Enums.TaskStatus.Done) / Tasks.Count * 100m
        : 0m;
}
