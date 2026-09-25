using JiraClone.Data.Domain.Interfaces;

namespace JiraClone.Data.Domain.Entities;

public class Executor : Employee, IExecutor
{
    public virtual ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    public string Password { get; set; } = string.Empty;
}
