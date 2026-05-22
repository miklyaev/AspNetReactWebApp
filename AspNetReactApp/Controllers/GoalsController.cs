using JiraClone.Data.Domain.Entities;
using JiraClone.Data.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AspNetReactApp.Controllers;

[ApiController]
[Route("api/goals")]
public class GoalsController : ControllerBase
{
    private readonly IDbService _dbService;

    public GoalsController(IDbService dbService)
    {
        _dbService = dbService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Goal>>> GetGoals()
    {
        var goals = await _dbService.GetGoalsAsync();
        return Ok(goals);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Goal>> GetGoal(int id)
    {
        var goal = await _dbService.GetGoalByIdAsync(id);
        return goal is null ? NotFound() : Ok(goal);
    }

    [HttpPost]
    public async Task<ActionResult<Goal>> CreateGoal([FromBody] GoalRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest("Title is required.");
        }

        var goal = new Goal
        {
            Title = request.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim()
        };

        var created = await _dbService.CreateGoalAsync(goal);
        return CreatedAtAction(nameof(GetGoal), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateGoal(int id, [FromBody] GoalRequest request)
    {
        var existing = await _dbService.GetGoalByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest("Title is required.");
        }

        existing.Title = request.Title.Trim();
        existing.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

        await _dbService.UpdateGoalAsync(existing);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteGoal(int id)
    {
        await _dbService.DeleteGoalAsync(id);
        return NoContent();
    }

    public sealed class GoalRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
