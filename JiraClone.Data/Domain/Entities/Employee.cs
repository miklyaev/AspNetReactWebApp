using JiraClone.Data.Domain.Interfaces;

namespace JiraClone.Data.Domain.Entities;

public abstract class Employee : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Login { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
