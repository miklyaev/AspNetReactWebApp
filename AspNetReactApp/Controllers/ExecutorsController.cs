using JiraClone.Data.Domain.Entities;
using JiraClone.Data.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
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

    [Authorize(Roles = "Admin,Leader")]
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
            Email = request.Email.Trim(),
            Login = request.Login.Trim(),
            Position = request.Position.Trim()
        };

        if (string.IsNullOrWhiteSpace(executor.Login))
        {
            return BadRequest("Login is required.");
        }

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            executor.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password.Trim());
        }
        else
        {
            return BadRequest("Password is required.");
        }

        var created = await _dbService.CreateExecutorAsync(executor);
        return CreatedAtAction(nameof(GetExecutors), new { id = created.Id }, created);
    }

    [Authorize(Roles = "Admin,Leader")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteExecutor(int id)
    {
        await _dbService.DeleteExecutorAsync(id);
        return NoContent();
    }

    [Authorize(Roles = "Admin,Leader")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<Executor>> UpdateExecutor(int id, [FromBody] ExecutorRequest request)
    {
        var executor = await _dbService.GetExecutorByIdAsync(id);
        if (executor == null)
        {
            return NotFound();
        }

        executor.Name = request.Name.Trim();
        executor.Email = request.Email.Trim();
        if (!string.IsNullOrWhiteSpace(request.Login))
        {
            executor.Login = request.Login.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            executor.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password.Trim());
        }

        executor.Position = string.IsNullOrWhiteSpace(request.Position) ? null : request.Position.Trim();

        await _dbService.UpdateEmployeeAsync(executor);
        return Ok(executor);
    }

    public sealed class ExecutorRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Login { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        // Placeholder to keep formatting consistent
    }
}
