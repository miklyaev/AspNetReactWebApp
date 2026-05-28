using JiraClone.Data.Domain.Interfaces;

namespace JiraClone.Data.Domain.Entities;

public abstract class Employee : BaseEntity // tracked
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Login { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? Position { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
}
