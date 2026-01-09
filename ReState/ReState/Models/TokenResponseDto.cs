namespace ReState.Models
{
    public class TokenResponseDto
    {
        public string? AccessToken { get; set; }
        public string? RefreshToken { get; set; }
        public bool Requires2FA { get; set; } = false;
        public string? Message { get; set; }

        // Ban properties
        public bool IsBanned { get; set; } = false;
        public string? BanReason { get; set; }

        // User info for admin dashboard
        public string? Role { get; set; }
        public string? City { get; set; }
        public string? Username { get; set; }
    }
}
