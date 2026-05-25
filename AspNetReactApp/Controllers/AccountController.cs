using AspNetReactApp.Auth;
using JiraClone.Data.Domain.Entities;
using JiraClone.Data.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AspNetReactApp.Controllers;

[ApiController]
[Authorize]
[Route("api/account")]
public class AccountController : ControllerBase
{
    private readonly IDbService _dbService;

    public AccountController(IDbService dbService)
    {
        _dbService = dbService;
    }

    [HttpPost("change-credentials")]
    public async Task<IActionResult> ChangeCredentials([FromBody] ChangeCredentialsRequest request)
    {
        if (AuthConstants.IsAdmin(User))
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(request.CurrentPassword))
        {
            return BadRequest("CurrentPassword is required.");
        }

        if (string.IsNullOrWhiteSpace(request.NewPassword) && string.IsNullOrWhiteSpace(request.NewLogin))
        {
            return BadRequest("NewLogin or NewPassword is required.");
        }

        var employeeId = AuthConstants.GetEmployeeId(User);
        if (employeeId is null)
        {
            return Unauthorized();
        }

        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

        Employee? employee = role == AuthConstants.Roles.Leader
            ? await _dbService.GetLeaderByIdAsync(employeeId.Value)
            : (role == AuthConstants.Roles.Executor ? await _dbService.GetExecutorByIdAsync(employeeId.Value) : null);

        if (employee is null)
        {
            return Unauthorized();
        }

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword.Trim(), employee.PasswordHash))
        {
            return Unauthorized();
        }

        if (!string.IsNullOrWhiteSpace(request.NewLogin))
        {
            employee.Login = request.NewLogin.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.NewPassword))
        {
            employee.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword.Trim());
        }

        await _dbService.UpdateEmployeeAsync(employee);
        return NoContent();
    }

    public sealed class ChangeCredentialsRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string? NewLogin { get; set; }
        public string? NewPassword { get; set; }
    }
}
