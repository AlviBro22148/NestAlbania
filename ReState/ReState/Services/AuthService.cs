using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ReState.Data;
using ReState.Entities;
using ReState.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace ReState.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;



        public AuthService(ApplicationDbContext context, IConfiguration configuration, IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
        }



        public async Task<TokenResponseDto?> AdminLoginAsync(UserDto request)
        {
            var user = await _context.Userss
                .FirstOrDefaultAsync(u => u.Username == request.Username);

            if (user is null)
                return null;

            // Check if user is admin or city admin
            if (user.Role != "Admin" && user.Role != "CityAdmin")
                return null;

            // Verify password hash
            var result = new PasswordHasher<User>()
                .VerifyHashedPassword(user, user.PasswordHash, request.Password);

            if (result == PasswordVerificationResult.Failed)
                return null;

            // Return tokens immediately without 2FA check for admin
            var response = new TokenResponseDto
            {
                AccessToken = CreateToken(user),
                RefreshToken = await GenerateAndSaveRefreshToken(user),
                Requires2FA = false,
                Role = user.Role,
                City = user.City,
                Username = user.Username
            };

            return response;
        }



        public async Task<TokenResponseDto?> LoginAsync(UserDto request)
        {
            var user = await _context.Userss
                .FirstOrDefaultAsync(u => u.Username == request.Username);

            if (user is null)
                return null;

            // Check if user is banned
            if (user.IsBanned)
            {
                return new TokenResponseDto
                {
                    AccessToken = null,
                    RefreshToken = null,
                    Requires2FA = false,
                    IsBanned = true,
                    BanReason = user.BanReason,
                    Message = "Your account has been banned."
                };
            }

            // Verify password hash
            var result = new PasswordHasher<User>()
                .VerifyHashedPassword(user, user.PasswordHash, request.Password);

            if (result == PasswordVerificationResult.Failed)
                return null;

            // Check if 2FA is enabled
            if (user.TwoFactorEnabled)
            {
                // Generate and save 2FA code
                var code = GenerateRandomCode();
                user.TwoFactorCode = code;
                user.TwoFactorCodeExpiry = DateTime.UtcNow.AddMinutes(10);
                await _context.SaveChangesAsync();

                // Send email with code
                await _emailService.SendTwoFactorCodeAsync(user.Email, code, user.Username);

                return new TokenResponseDto
                {
                    AccessToken = null,
                    RefreshToken = null,
                    Requires2FA = true,
                    Message = "Verification code sent to your email"
                };
            }

            // Normal login without 2FA
            var response = new TokenResponseDto
            {
                AccessToken = CreateToken(user),
                RefreshToken = await GenerateAndSaveRefreshToken(user),
                Requires2FA = false
            };

            return response;
        }



        private string GenerateRandomCode()
        {
            return RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        }



        public async Task<TokenResponseDto?> LoginWith2FAAsync(LoginWith2FACodeDto request)
        {
            var user = await _context.Userss
                .FirstOrDefaultAsync(u => u.Username == request.Username);

            if (user is null)
                return null;

            // Check if user is banned
            if (user.IsBanned)
            {
                return new TokenResponseDto
                {
                    AccessToken = null,
                    RefreshToken = null,
                    Requires2FA = false,
                    IsBanned = true,
                    BanReason = user.BanReason,
                    Message = "Your account has been banned."
                };
            }

            if (!user.TwoFactorEnabled)
                return null;

            if (string.IsNullOrEmpty(user.TwoFactorCode))
                return null;

            if (user.TwoFactorCodeExpiry < DateTime.UtcNow)
                return null;

            if (user.TwoFactorCode != request.Code)
                return null;

            // Clear the 2FA code after successful verification
            user.TwoFactorCode = null;
            user.TwoFactorCodeExpiry = null;
            await _context.SaveChangesAsync();

            // Return tokens
            return new TokenResponseDto
            {
                AccessToken = CreateToken(user),
                RefreshToken = await GenerateAndSaveRefreshToken(user),
                Requires2FA = false
            };
        }



        public async Task<User?> RegisterAsync(UserDto request)
        {
            if (await _context.Userss.AnyAsync(u => u.Username == request.Username))
            {
                return null;
            }

            // Check if email already exists 
            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                if (await _context.Userss.AnyAsync(u => u.Email == request.Email))
                {
                    return null;
                }
            }

            // Check if phone number already exists
            if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
            {
                if (await _context.Userss.AnyAsync(u => u.PhoneNumber == request.PhoneNumber))
                {
                    return null;
                }
            }

            var user = new User
            {
                Username = request.Username,
                Email = request.Email ?? string.Empty,
                PhoneNumber = request.PhoneNumber ?? string.Empty,
                City = request.City,
                Role = "User",
            };

            var hashedPassword = new PasswordHasher<User>()
                .HashPassword(user, request.Password);

            user.PasswordHash = hashedPassword;

            _context.Userss.Add(user);
            await _context.SaveChangesAsync();

            return user;
        }



        private string CreateToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            // Add city claim for CityAdmin users
            if (user.Role == "CityAdmin" && !string.IsNullOrEmpty(user.City))
            {
                claims.Add(new Claim("city", user.City));
            }

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["AppSettings:Token"]!));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512);

            var tokenDescriptor = new JwtSecurityToken(
                issuer: _configuration["AppSettings:Issuer"],
                audience: _configuration["AppSettings:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
        }



        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }



        private async Task<string> GenerateAndSaveRefreshToken(User user)
        {
            var refreshToken = GenerateRefreshToken();
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _context.SaveChangesAsync();
            return refreshToken;
        }



        private async Task<TokenResponseDto> CreateTokenResponse(User user)
        {
            return new TokenResponseDto
            {
                AccessToken = CreateToken(user),
                RefreshToken = await GenerateAndSaveRefreshToken(user)
            };
        }



        public async Task<TokenResponseDto?> RefreshTokensAsync(RefreshTokenRequestDto request)
        {
            if (!Guid.TryParse(request.UserId, out Guid userId))
            {
                return null;
            }

            var user = await ValidateRefreshToken(userId, request.RefreshToken);

            if (user is null)
            {
                return null;
            }

            return await CreateTokenResponse(user);
        }



        public async Task<User?> ValidateRefreshToken(Guid userId, string refreshToken)
        {
            var user = await _context.Userss.FirstOrDefaultAsync(u => u.Id == userId);

            if (user is null ||
                user.RefreshToken != refreshToken ||
                user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            {
                return null;
            }

            return user;
        }



    }
}