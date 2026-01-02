namespace ReState.Models
{
    public class RefreshTokenRequestDto
    {
        public string UserId { get; set; } = string.Empty;
        public required string RefreshToken { get; set; }
    }
}
