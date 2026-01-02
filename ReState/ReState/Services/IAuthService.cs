using ReState.Entities;
using ReState.Models;

namespace ReState.Services
{
    public interface IAuthService
    {
        Task<TokenResponseDto?> LoginAsync(UserDto request);
        Task<TokenResponseDto?> AdminLoginAsync(UserDto request);
        Task<User?> RegisterAsync(UserDto request); 
        Task<User?> ValidateRefreshToken(Guid userId, string refreshToken);
        Task<TokenResponseDto?> RefreshTokensAsync(RefreshTokenRequestDto request);
        Task<TokenResponseDto?> LoginWith2FAAsync(LoginWith2FACodeDto request);
    }
}