using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReState.Data;
using ReState.Entities;
using ReState.Models;
using ReState.Services;
using System.Security.Claims;
using System.Security.Cryptography;

namespace ReState.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TwoFactorController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly ILogger<TwoFactorController> _logger;

        public TwoFactorController(
            ApplicationDbContext context,
            IEmailService emailService,
            ILogger<TwoFactorController> logger)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
        }

        // GET: api/twofactor/status
        [HttpGet("status")]
        public async Task<IActionResult> Get2FAStatus()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                {
                    _logger.LogWarning("User not authenticated - no user ID found in claims");
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var user = await _context.Userss.FindAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning($"User not found: {userId}");
                    return NotFound(new { message = "User not found" });
                }

                _logger.LogInformation($"2FA status retrieved for user: {user.Username}");
                return Ok(new
                {
                    isEnabled = user.TwoFactorEnabled,
                    email = user.Email
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting 2FA status: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving 2FA status" });
            }
        }

        // POST: api/twofactor/enable
        [HttpPost("enable")]
        public async Task<IActionResult> Enable2FA([FromBody] Enable2FARequestDto request)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var user = await _context.Userss.FindAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                // Check if 2FA is already enabled
                if (user.TwoFactorEnabled)
                    return BadRequest(new { message = "Two-factor authentication is already enabled" });

                // Verify password hash - FIXED: Actually check the result!
                var result = new PasswordHasher<User>()
                    .VerifyHashedPassword(user, user.PasswordHash, request.Password);

                if (result == PasswordVerificationResult.Failed)
                    return BadRequest(new { message = "Invalid password" });

                // Generate 6-digit code
                var code = GenerateRandomCode();
                user.TwoFactorCode = code;
                user.TwoFactorCodeExpiry = DateTime.UtcNow.AddMinutes(10);

                await _context.SaveChangesAsync();

                // Send email
                await _emailService.SendTwoFactorCodeAsync(user.Email, code, user.Username);

                _logger.LogInformation($"2FA enable requested for user: {user.Username}");
                return Ok(new { message = "Verification code sent to your email" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error enabling 2FA: {ex.Message}");
                return StatusCode(500, new { message = "Error enabling two-factor authentication" });
            }
        }

        // POST: api/twofactor/verify
        [HttpPost("verify")]
        public async Task<IActionResult> Verify2FACode([FromBody] Verify2FACodeDto request)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var user = await _context.Userss.FindAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                if (string.IsNullOrEmpty(user.TwoFactorCode))
                    return BadRequest(new { message = "No verification code found. Please request a new one." });

                if (user.TwoFactorCodeExpiry < DateTime.UtcNow)
                    return BadRequest(new { message = "Verification code has expired" });

                if (user.TwoFactorCode != request.Code)
                    return BadRequest(new { message = "Invalid verification code" });

                // Enable 2FA
                user.TwoFactorEnabled = true;
                user.TwoFactorCode = null;
                user.TwoFactorCodeExpiry = null;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"2FA enabled successfully for user: {user.Username}");
                return Ok(new { message = "Two-factor authentication enabled successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error verifying 2FA code: {ex.Message}");
                return StatusCode(500, new { message = "Error verifying code" });
            }
        }

        // POST: api/twofactor/disable
        [HttpPost("disable")]
        public async Task<IActionResult> Disable2FA([FromBody] Disable2FADto request)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var user = await _context.Userss.FindAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                // Check if 2FA is enabled
                if (!user.TwoFactorEnabled)
                    return BadRequest(new { message = "Two-factor authentication is not enabled" });

                // Verify password hash - FIXED: Actually check the result!
                var result = new PasswordHasher<User>()
                    .VerifyHashedPassword(user, user.PasswordHash, request.Password);

                if (result == PasswordVerificationResult.Failed)
                    return BadRequest(new { message = "Invalid password" });

                // Disable 2FA
                user.TwoFactorEnabled = false;
                user.TwoFactorCode = null;
                user.TwoFactorCodeExpiry = null;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"2FA disabled for user: {user.Username}");
                return Ok(new { message = "Two-factor authentication disabled successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error disabling 2FA: {ex.Message}");
                return StatusCode(500, new { message = "Error disabling two-factor authentication" });
            }
        }

        // POST: api/twofactor/resend-code
        [HttpPost("resend-code")]
        public async Task<IActionResult> ResendCode()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var user = await _context.Userss.FindAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                // Generate new code
                var code = GenerateRandomCode();
                user.TwoFactorCode = code;
                user.TwoFactorCodeExpiry = DateTime.UtcNow.AddMinutes(10);

                await _context.SaveChangesAsync();

                // Send email
                await _emailService.SendTwoFactorCodeAsync(user.Email, code, user.Username);

                _logger.LogInformation($"2FA code resent for user: {user.Username}");
                return Ok(new { message = "New verification code sent to your email" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error resending code: {ex.Message}");
                return StatusCode(500, new { message = "Error sending verification code" });
            }
        }

        private string GenerateRandomCode()
        {
            return RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        }
    }
}