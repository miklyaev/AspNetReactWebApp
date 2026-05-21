using JiraClone.Data.Domain.Interfaces;

namespace JiraClone.Data.Domain.Entities;

public class Goal : BaseEntity, IGoal
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    public virtual ICollection<Project> Projects { get; set; } = new List<Project>();

    public decimal Progress => Projects.Any() 
        ? Projects.Average(p => p.Progress) 
        : 0m;
}
