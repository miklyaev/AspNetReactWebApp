using JiraClone.Data.Domain.Interfaces;

namespace JiraClone.Data.Domain.Entities;

public class TaskItem : BaseEntity, ITaskItem
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public JiraClone.Data.Domain.Enums.TaskStatus Status { get; set; } = Enums.TaskStatus.ToDo;
    public JiraClone.Data.Domain.Enums.TaskPriority Priority { get; set; } = Enums.TaskPriority.Medium;
    
    public int ProjectId { get; set; }
    public virtual Project? Project { get; set; }
    
    public int? ExecutorId { get; set; }
    public virtual Executor? Executor { get; set; }

    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public virtual ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
}
