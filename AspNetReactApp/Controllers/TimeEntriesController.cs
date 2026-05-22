using JiraClone.Data.Domain.Entities;
using JiraClone.Data.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AspNetReactApp.Controllers;

[ApiController]
[Route("api/timeentries")]
public class TimeEntriesController : ControllerBase
{
    private readonly IDbService _dbService;

    public TimeEntriesController(IDbService dbService)
    {
        _dbService = dbService;
    }

    [HttpGet]
    public async Task<ActionResult<List<TimeEntry>>> GetTimeEntries([FromQuery] int? taskId)
    {
        var entries = taskId.HasValue
            ? await _dbService.GetTimeEntriesByTaskIdAsync(taskId.Value)
            : await _dbService.GetTimeEntriesAsync();

        return Ok(entries);
    }

    [HttpGet("task/{taskId:int}/total-hours")]
    public async Task<ActionResult<decimal>> GetTotalHours(int taskId)
    {
        var totalHours = await _dbService.GetTotalHoursByTaskAsync(taskId);
        return Ok(totalHours);
    }

    [HttpPost]
    public async Task<ActionResult<TimeEntry>> CreateTimeEntry([FromBody] TimeEntryRequest request)
    {
        if (request.Hours <= 0)
        {
            return BadRequest("Hours must be greater than zero.");
        }

        var task = await _dbService.GetTaskByIdAsync(request.TaskItemId);
        if (task is null)
        {
            return BadRequest("Task not found.");
        }

        var executors = await _dbService.GetExecutorsAsync();
        if (!executors.Any(e => e.Id == request.ExecutorId))
        {
            return BadRequest("Executor not found.");
        }

        var entry = new TimeEntry
        {
            Hours = request.Hours,
            Date = request.Date ?? DateTime.UtcNow,
            TaskItemId = request.TaskItemId,
            ExecutorId = request.ExecutorId
        };

        var created = await _dbService.AddTimeEntryAsync(entry);
        return Ok(created);
    }

    public sealed class TimeEntryRequest
    {
        public decimal Hours { get; set; }
        public DateTime? Date { get; set; }
        public int TaskItemId { get; set; }
        public int ExecutorId { get; set; }
    }
}
