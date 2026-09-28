using System.Text.RegularExpressions;

namespace AspNetReactApp.Validation;

public static class EmailValidator
{
    private static readonly Regex EmailRegex = new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.Compiled);

    public static bool IsValid(string? email)
        => !string.IsNullOrWhiteSpace(email) && EmailRegex.IsMatch(email.Trim());
}
