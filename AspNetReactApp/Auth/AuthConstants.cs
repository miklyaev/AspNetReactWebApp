using System.Security.Claims;

namespace AspNetReactApp.Auth;

public static class AuthConstants
{
    public const string CookieScheme = "AppCookie";

    public static class Roles
    {
        public const string Admin = "Admin";
        public const string Leader = "Leader";
        public const string Executor = "Executor";
    }

    public static class ClaimTypesEx
    {
        public const string EmployeeId = "employee_id";
        public const string EmployeeType = "employee_type";
        public const string IsAdmin = "is_admin";
    }

    public static int? GetEmployeeId(ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ClaimTypesEx.EmployeeId);
        return int.TryParse(value, out var id) ? id : null;
    }

    public static bool IsAdmin(ClaimsPrincipal user)
        => string.Equals(user.FindFirstValue(ClaimTypesEx.IsAdmin), "true", StringComparison.OrdinalIgnoreCase);
}
