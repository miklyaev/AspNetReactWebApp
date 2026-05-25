using System.ComponentModel.DataAnnotations;

namespace JiraClone.Data.Domain.Entities;

public class Profile : BaseEntity
{
    public int? EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    [MaxLength(64)]
    public string? ExternalKey { get; set; }

    public bool IsAdminProfile { get; set; }

    public string TablesColumnsJson { get; set; } = "{}";
}
