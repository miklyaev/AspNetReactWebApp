using JiraClone.Data.Domain.Interfaces;

namespace JiraClone.Data.Domain.Entities;

public class TimeEntry : BaseEntity, ITimeEntry
{
    public decimal Hours { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
    
    public int TaskItemId { get; set; }
    public virtual TaskItem? TaskItem { get; set; }
    
    public int ExecutorId { get; set; }
    public virtual Executor? Executor { get; set; }
}
