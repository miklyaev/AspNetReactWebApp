using System.Text.Json;
using AspNetReactApp.Auth;
using JiraClone.Data.Domain.Entities;
using JiraClone.Data.Infrastructure.Db;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AspNetReactApp.Controllers;

[ApiController]
[Authorize]
[Route("api/profile")]
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProfileController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<ProfileDto>> Get()
    {
        var profile = await GetOrCreateProfileAsync();
        return Ok(ToDto(profile));
    }

    [HttpPut]
    public async Task<ActionResult<ProfileDto>> Update([FromBody] UpdateProfileRequest request)
    {
        var profile = await GetOrCreateProfileAsync();

        if (request.TablesColumns is not null)
        {
            profile.TablesColumnsJson = JsonSerializer.Serialize(request.TablesColumns);
        }

        await _db.SaveChangesAsync();
        return Ok(ToDto(profile));
    }

    private async Task<Profile> GetOrCreateProfileAsync()
    {
        if (AuthConstants.IsAdmin(User))
        {
            var existingAdmin = await _db.Profiles.FirstOrDefaultAsync(p => p.ExternalKey == "admin");
            if (existingAdmin is not null)
            {
                return existingAdmin;
            }

            var createdAdmin = new Profile
            {
                ExternalKey = "admin",
                IsAdminProfile = true,
                TablesColumnsJson = "{}"
            };

            _db.Profiles.Add(createdAdmin);
            await _db.SaveChangesAsync();
            return createdAdmin;
        }

        var employeeId = AuthConstants.GetEmployeeId(User);
        if (employeeId is null)
        {
            throw new InvalidOperationException("Authenticated user without employee_id claim.");
        }

        var existing = await _db.Profiles.FirstOrDefaultAsync(p => p.EmployeeId == employeeId.Value);
        if (existing is not null)
        {
            return existing;
        }

        var created = new Profile
        {
            EmployeeId = employeeId.Value,
            IsAdminProfile = false,
            TablesColumnsJson = "{}"
        };

        _db.Profiles.Add(created);
        await _db.SaveChangesAsync();
        return created;
    }

    private static ProfileDto ToDto(Profile profile)
        => new()
        {
            Id = profile.Id,
            EmployeeId = profile.EmployeeId,
            ExternalKey = profile.ExternalKey,
            IsAdminProfile = profile.IsAdminProfile,
            TablesColumnsJson = profile.TablesColumnsJson
        };

    public sealed class ProfileDto
    {
        public int Id { get; set; }
        public int? EmployeeId { get; set; }
        public string? ExternalKey { get; set; }
        public bool IsAdminProfile { get; set; }
        public string TablesColumnsJson { get; set; } = "{}";
    }

    public sealed class UpdateProfileRequest
    {
        public Dictionary<string, string[]>? TablesColumns { get; set; }
    }
}
