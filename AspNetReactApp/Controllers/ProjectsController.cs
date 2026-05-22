using JiraClone.Data.Domain.Entities;
using JiraClone.Data.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AspNetReactApp.Controllers;

[ApiController]
[Route("api/projects")]
public class ProjectsController : ControllerBase
{
    private readonly IDbService _dbService;

    public ProjectsController(IDbService dbService)
    {
        _dbService = dbService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Project>>> GetProjects([FromQuery] int? goalId)
    {
        var projects = goalId.HasValue
            ? await _dbService.GetProjectsByGoalIdAsync(goalId.Value)
            : await _dbService.GetProjectsAsync();

        return Ok(projects);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Project>> GetProject(int id)
    {
        var project = await _dbService.GetProjectByIdAsync(id);
        return project is null ? NotFound() : Ok(project);
    }

    [HttpPost]
    public async Task<ActionResult<Project>> CreateProject([FromBody] ProjectRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest("Title is required.");
        }

        var goal = await _dbService.GetGoalByIdAsync(request.GoalId);
        if (goal is null)
        {
            return BadRequest("Goal not found.");
        }

        var project = new Project
        {
            Title = request.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            GoalId = request.GoalId
        };

        var created = await _dbService.CreateProjectAsync(project);
        return CreatedAtAction(nameof(GetProject), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateProject(int id, [FromBody] ProjectRequest request)
    {
        var existing = await _dbService.GetProjectByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest("Title is required.");
        }

        var goal = await _dbService.GetGoalByIdAsync(request.GoalId);
        if (goal is null)
        {
            return BadRequest("Goal not found.");
        }

        existing.Title = request.Title.Trim();
        existing.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        existing.GoalId = request.GoalId;

        await _dbService.UpdateProjectAsync(existing);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteProject(int id)
    {
        await _dbService.DeleteProjectAsync(id);
        return NoContent();
    }

    public sealed class ProjectRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int GoalId { get; set; }
    }
}
