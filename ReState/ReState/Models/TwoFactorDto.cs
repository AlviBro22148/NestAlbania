namespace ReState.Models
{
    public class Enable2FARequestDto
    {
        public string Password { get; set; } = string.Empty;
    }

    public class Verify2FACodeDto
    {
        public string Code { get; set; } = string.Empty;
    }

    public class Disable2FADto
    {
        public string Password { get; set; } = string.Empty;
    }

    public class TwoFactorStatusDto
    {
        public bool IsEnabled { get; set; }
        public string? Email { get; set; }
    }

    public class Login2FADto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginWith2FACodeDto
    {
        public string Username { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }
}