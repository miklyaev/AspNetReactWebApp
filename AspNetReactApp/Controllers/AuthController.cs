using System.Security.Claims;
using AspNetReactApp.Auth;
using JiraClone.Data.Domain.Entities;
using JiraClone.Data.Domain.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AspNetReactApp.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IDbService _dbService;
    private readonly IConfiguration _configuration;

    public AuthController(IDbService dbService, IConfiguration configuration)
    {
        _dbService = dbService;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Login) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Login and password are required.");
        }

        var login = request.Login.Trim();
        var password = request.Password.Trim();

        if (string.Equals(login, "admin", StringComparison.OrdinalIgnoreCase))
        {
            var adminPassword = _configuration["ADMIN_PASSWORD"] ?? "SimpleJira";
            if (!string.Equals(password, adminPassword, StringComparison.Ordinal))
            {
                return Unauthorized();
            }

            var claims = new List<Claim>
            {
                new(ClaimTypes.Name, "admin"),
                new(ClaimTypes.Role, AuthConstants.Roles.Admin),
                new(AuthConstants.ClaimTypesEx.IsAdmin, "true"),
                new(AuthConstants.ClaimTypesEx.EmployeeType, "Admin")
            };

            await SignInAsync(claims);
            return Ok(new MeResponse
            {
                IsAuthenticated = true,
                Role = AuthConstants.Roles.Admin,
                Login = "admin",
                Name = "Администратор",
                EmployeeId = null,
                IsAdmin = true
            });
        }

        var leader = (await _dbService.GetLeadersAsync())
            .FirstOrDefault(x => x.Login.Equals(login, StringComparison.OrdinalIgnoreCase));

        if (leader is not null && BCrypt.Net.BCrypt.Verify(password, leader.PasswordHash))
        {
            await SignInEmployeeAsync(leader, AuthConstants.Roles.Leader, "Leader");
            return Ok(ToMeResponse(leader, AuthConstants.Roles.Leader, false));
        }

        var executor = (await _dbService.GetExecutorsAsync())
            .FirstOrDefault(x => x.Login.Equals(login, StringComparison.OrdinalIgnoreCase));

        if (executor is not null && BCrypt.Net.BCrypt.Verify(password, executor.PasswordHash))
        {
            await SignInEmployeeAsync(executor, AuthConstants.Roles.Executor, "Executor");
            return Ok(ToMeResponse(executor, AuthConstants.Roles.Executor, false));
        }

        return Unauthorized();
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(AuthConstants.CookieScheme);
        return NoContent();
    }

    [HttpGet("me")]
    public async Task<ActionResult<MeResponse>> Me()
    {
        if (!User.Identity?.IsAuthenticated ?? true)
        {
            return Ok(new MeResponse { IsAuthenticated = false });
        }

        var role = User.FindFirstValue(ClaimTypes.Role);
        var isAdmin = AuthConstants.IsAdmin(User);
        var employeeId = AuthConstants.GetEmployeeId(User);

        if (isAdmin)
        {
            return Ok(new MeResponse
            {
                IsAuthenticated = true,
                Role = AuthConstants.Roles.Admin,
                Login = "admin",
                Name = "Администратор",
                EmployeeId = null,
                IsAdmin = true
            });
        }

        if (employeeId is null)
        {
            await HttpContext.SignOutAsync(AuthConstants.CookieScheme);
            return Ok(new MeResponse { IsAuthenticated = false });
        }

        Employee? employee = role == AuthConstants.Roles.Leader
            ? await _dbService.GetLeaderByIdAsync(employeeId.Value)
            : (role == AuthConstants.Roles.Executor ? await _dbService.GetExecutorByIdAsync(employeeId.Value) : null);

        if (employee is null)
        {
            await HttpContext.SignOutAsync(AuthConstants.CookieScheme);
            return Ok(new MeResponse { IsAuthenticated = false });
        }

        return Ok(ToMeResponse(employee, role ?? string.Empty, false));
    }

    private static MeResponse ToMeResponse(Employee employee, string role, bool isAdmin)
        => new()
        {
            IsAuthenticated = true,
            Role = role,
            Login = employee.Login,
            Name = employee.Name,
            EmployeeId = employee.Id,
            IsAdmin = isAdmin
        };

    private Task SignInEmployeeAsync(Employee employee, string role, string employeeType)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, employee.Id.ToString()),
            new(ClaimTypes.Name, employee.Login),
            new(ClaimTypes.Role, role),
            new(AuthConstants.ClaimTypesEx.EmployeeId, employee.Id.ToString()),
            new(AuthConstants.ClaimTypesEx.EmployeeType, employeeType),
            new(AuthConstants.ClaimTypesEx.IsAdmin, "false")
        };

        return SignInAsync(claims);
    }

    private Task SignInAsync(List<Claim> claims)
    {
        var identity = new ClaimsIdentity(claims, AuthConstants.CookieScheme);
        var principal = new ClaimsPrincipal(identity);
        return HttpContext.SignInAsync(AuthConstants.CookieScheme, principal);
    }

    public sealed class LoginRequest
    {
        public string Login { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public sealed class MeResponse
    {
        public bool IsAuthenticated { get; set; }
        public string? Role { get; set; }
        public int? EmployeeId { get; set; }
        public string? Login { get; set; }
        public string? Name { get; set; }
        public bool IsAdmin { get; set; }
    }
}
