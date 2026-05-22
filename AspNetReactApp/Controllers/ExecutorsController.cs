using JiraClone.Data.Domain.Entities;
using JiraClone.Data.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AspNetReactApp.Controllers;

[ApiController]
[Route("api/executors")]
public class ExecutorsController : ControllerBase
{
    private readonly IDbService _dbService;

    public ExecutorsController(IDbService dbService)
    {
        _dbService = dbService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Executor>>> GetExecutors()
    {
        var executors = await _dbService.GetExecutorsAsync();
        return Ok(executors);
    }

    [HttpPost]
    public async Task<ActionResult<Executor>> CreateExecutor([FromBody] ExecutorRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest("Name and email are required.");
        }

        var executor = new Executor
        {
            Name = request.Name.Trim(),
            Email = request.Email.Trim()
        };

        var created = await _dbService.CreateExecutorAsync(executor);
        return CreatedAtAction(nameof(GetExecutors), new { id = created.Id }, created);
    }

    public sealed class ExecutorRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }
}
