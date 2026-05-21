using JiraClone.Data.Domain.Interfaces;

namespace JiraClone.Data.Domain.Entities;

public class Comment : BaseEntity, IComment
{
    public string Text { get; set; } = string.Empty;
    public int TaskItemId { get; set; }
    public virtual TaskItem? TaskItem { get; set; }
    
    public int AuthorId { get; set; }
    public virtual Executor? Author { get; set; }
}
