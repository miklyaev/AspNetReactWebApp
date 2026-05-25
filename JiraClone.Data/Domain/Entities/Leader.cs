using JiraClone.Data.Domain.Interfaces;

namespace JiraClone.Data.Domain.Entities;

public class Leader : Employee, ILeader
{
    public string Password { get; set; } = string.Empty;
}
