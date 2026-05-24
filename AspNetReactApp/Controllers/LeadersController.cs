using JiraClone.Data.Domain.Entities;
using JiraClone.Data.Domain.Interfaces;
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
            Email = request.Email.Trim()
        };

        var created = await _dbService.CreateLeaderAsync(Leader);
        return CreatedAtAction(nameof(GetLeaders), new { id = created.Id }, created);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteLeader(int id)
    {
        await _dbService.DeleteLeaderAsync(id);
        return NoContent();
    }

    public sealed class LeaderRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }
}
