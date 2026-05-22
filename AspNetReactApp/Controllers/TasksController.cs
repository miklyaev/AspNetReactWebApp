using JiraClone.Data.Domain.Entities;
using JiraClone.Data.Domain.Enums;
using JiraClone.Data.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AspNetReactApp.Controllers;

[ApiController]
[Route("api/tasks")]
public class TasksController : ControllerBase
{
    private readonly IDbService _dbService;

    public TasksController(IDbService dbService)
    {
        _dbService = dbService;
    }

    [HttpGet]
    public async Task<ActionResult<List<TaskItem>>> GetTasks([FromQuery] int? projectId)
    {
        var tasks = projectId.HasValue
            ? await _dbService.GetTasksByProjectIdAsync(projectId.Value)
            : await _dbService.GetTasksAsync();

        return Ok(tasks);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TaskItem>> GetTask(int id)
    {
        var task = await _dbService.GetTaskByIdAsync(id);
        return task is null ? NotFound() : Ok(task);
    }

    [HttpPost]
    public async Task<ActionResult<TaskItem>> CreateTask([FromBody] TaskRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest("Title is required.");
        }

        var project = await _dbService.GetProjectByIdAsync(request.ProjectId);
        if (project is null)
        {
            return BadRequest("Project not found.");
        }

        if (request.ExecutorId.HasValue)
        {
            var executors = await _dbService.GetExecutorsAsync();
            if (!executors.Any(e => e.Id == request.ExecutorId.Value))
            {
                return BadRequest("Executor not found.");
            }
        }

        var task = new TaskItem
        {
            Title = request.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            ProjectId = request.ProjectId,
            ExecutorId = request.ExecutorId,
            Status = request.Status,
            Priority = request.Priority
        };

        var created = await _dbService.CreateTaskAsync(task);
        return CreatedAtAction(nameof(GetTask), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateTask(int id, [FromBody] TaskRequest request)
    {
        var existing = await _dbService.GetTaskByIdAsync(id);
        if (existing is null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest("Title is required.");
        }

        var project = await _dbService.GetProjectByIdAsync(request.ProjectId);
        if (project is null)
        {
            return BadRequest("Project not found.");
        }

        if (request.ExecutorId.HasValue)
        {
            var executors = await _dbService.GetExecutorsAsync();
            if (!executors.Any(e => e.Id == request.ExecutorId.Value))
            {
                return BadRequest("Executor not found.");
            }
        }

        existing.Title = request.Title.Trim();
        existing.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        existing.ProjectId = request.ProjectId;
        existing.ExecutorId = request.ExecutorId;
        existing.Status = request.Status;
        existing.Priority = request.Priority;

        await _dbService.UpdateTaskAsync(existing);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        await _dbService.DeleteTaskAsync(id);
        return NoContent();
    }

    public sealed class TaskRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int ProjectId { get; set; }
        public int? ExecutorId { get; set; }
        public JiraClone.Data.Domain.Enums.TaskStatus Status { get; set; } = JiraClone.Data.Domain.Enums.TaskStatus.ToDo;
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    }
}
