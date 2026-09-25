using JiraClone.Data.Domain.Entities;
using JiraClone.Data.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AspNetReactApp.Controllers;

[ApiController]
[Route("api/leaders")]
public class LeadersController : ControllerBase
{
    private readonly IDbService _dbService;

    public LeadersController(IDbService dbService)
    {
        _dbService = dbService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Leader>>> GetLeaders()
    {
        var Leaders = await _dbService.GetLeadersAsync();
        return Ok(Leaders);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<Leader>> CreateLeader([FromBody] LeaderRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest("Name and email are required.");
        }

        var Leader = new Leader
        {
            Name = request.Name.Trim(),
            Email = request.Email.Trim(),
            Login = request.Login.Trim(),
            Position = request.Position.Trim()
        };

        if (string.IsNullOrWhiteSpace(Leader.Login))
        {
            return BadRequest("Login is required.");
        }

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            Leader.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password.Trim());
        }
        else
        {
            return BadRequest("Password is required.");
        }

        var created = await _dbService.CreateLeaderAsync(Leader);
        return CreatedAtAction(nameof(GetLeaders), new { id = created.Id }, created);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteLeader(int id)
    {
        await _dbService.DeleteLeaderAsync(id);
        return NoContent();
    }

    [Authorize(Roles = "Admin,Leader")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<Leader>> UpdateLeader(int id, [FromBody] LeaderRequest request)
    {
        var leader = await _dbService.GetLeaderByIdAsync(id);
        if (leader == null)
        {
            return NotFound();
        }

        leader.Name = request.Name.Trim();
        leader.Email = request.Email.Trim();
        if (!string.IsNullOrWhiteSpace(request.Login))
        {
            leader.Login = request.Login.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            leader.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password.Trim());
        }
        leader.Position = string.IsNullOrWhiteSpace(request.Position) ? null : request.Position.Trim();
        leader.Phone = request.Phone?.Trim();
        leader.Address = request.Address?.Trim();

        await _dbService.UpdateEmployeeAsync(leader);        return Ok(leader);
    }

    public sealed class LeaderRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Login { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
    }}
