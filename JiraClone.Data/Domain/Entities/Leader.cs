using JiraClone.Data.Domain.Interfaces;

namespace JiraClone.Data.Domain.Entities;

public class Leader : BaseEntity, ILeader
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
