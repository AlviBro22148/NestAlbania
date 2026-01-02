
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ReState.Data;
using ReState.Entities;
using ReState.Models;
using ReState.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using YourNamespace.Models;

namespace ReState.Controllers
{
    
    [Route("api/[controller]")]

    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly INotificationService _notificationService;

        public AuthController(IAuthService authService, ApplicationDbContext context, IConfiguration configuration, ICloudinaryService cloudinaryService, INotificationService notificationService)
        {
            _authService = authService;
            _context = context;
            _configuration = configuration;
            _cloudinaryService = cloudinaryService;
            _notificationService = notificationService;
        }




        // GET: Get all agent requests (with optional status filter)
        [HttpGet("admin/agent-requests")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAgentRequests([FromQuery] string status = null)
        {
            try
            {
                var query = _context.AgentRequests
                    .Include(r => r.User)
                    .Include(r => r.Reviewer)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(status) && status != "All")
                {
                    // Map "Declined" to "Rejected" for React Native compatibility
                    var dbStatus = status == "Declined" ? "Rejected" : status;
                    query = query.Where(r => r.Status == dbStatus);
                }

                var requests = await query
                    .OrderByDescending(r => r.RequestedAt)
                    .Select(r => new
                    {
                        id = r.Id,
                        userId = r.UserId,
                        username = r.Username,
                        email = r.Email,
                        phoneNumber = r.PhoneNumber,
                        status = r.Status,
                        requestedAt = r.RequestedAt,
                        reviewedAt = r.ReviewedAt,
                        reviewedBy = r.Reviewer != null ? r.Reviewer.Username : null,
                        rejectionReason = r.RejectionReason,
                        // Include both field names for compatibility
                        userProfilePicture = r.User.ProfilePictureUrl,
                        profilePictureUrl = r.User.ProfilePictureUrl
                    })
                    .ToListAsync();

                return Ok(requests);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching agent requests", error = ex.Message });
            }
        }

        // GET: Get agent request statistics
        [HttpGet("admin/agent-requests/stats")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAgentRequestStats()
        {
            try
            {
                var total = await _context.AgentRequests.CountAsync();
                var pending = await _context.AgentRequests.CountAsync(r => r.Status == "Pending");
                var approved = await _context.AgentRequests.CountAsync(r => r.Status == "Approved");
                var rejected = await _context.AgentRequests.CountAsync(r => r.Status == "Rejected");

                return Ok(new
                {
                    total = total,
                    pending = pending,
                    approved = approved,
                    rejected = rejected,
                    // Alias for React Native compatibility
                    declined = rejected
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching agent request stats", error = ex.Message });
            }
        }




        // POST: Approve agent request
        [HttpPost("admin/agent-requests/{requestId}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveAgentRequest(Guid requestId)
        {
            try
            {
                var adminIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(adminIdString) || !Guid.TryParse(adminIdString, out Guid adminId))
                    return Unauthorized(new { message = "Admin not authenticated" });

                var request = await _context.AgentRequests
                    .Include(r => r.User)
                    .FirstOrDefaultAsync(r => r.Id == requestId);

                if (request == null)
                    return NotFound(new { message = "Agent request not found" });

                if (request.Status != "Pending")
                    return BadRequest(new { message = $"Cannot approve request with status: {request.Status}" });

                // Update user role to Agent
                request.User.Role = "Agent";

                // Update request status
                request.Status = "Approved";
                request.ReviewedAt = DateTime.UtcNow;
                request.ReviewedBy = adminId;

                await _context.SaveChangesAsync();

                // Send notification to the user
                await _notificationService.NotifyAgentRequestApproved(request.UserId, request.Username);

                return Ok(new
                {
                    message = $"Agent request approved. {request.Username} is now an agent.",
                    requestId = request.Id,
                    userId = request.UserId,
                    newRole = "Agent"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error approving agent request", error = ex.Message });
            }
        }



        // POST: Reject agent request
        [HttpPost("admin/agent-requests/{requestId}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RejectAgentRequest(Guid requestId, [FromBody] RejectAgentRequestDto dto)
        {
            return await ProcessAgentRequestRejection(requestId, dto);
        }

        // POST: Decline agent request (alias for reject - React Native compatibility)
        [HttpPost("admin/agent-requests/{requestId}/decline")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeclineAgentRequest(Guid requestId, [FromBody] RejectAgentRequestDto dto)
        {
            return await ProcessAgentRequestRejection(requestId, dto);
        }

        // Shared logic for reject/decline
        private async Task<IActionResult> ProcessAgentRequestRejection(Guid requestId, RejectAgentRequestDto dto)
        {
            try
            {
                var adminIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(adminIdString) || !Guid.TryParse(adminIdString, out Guid adminId))
                    return Unauthorized(new { message = "Admin not authenticated" });

                var request = await _context.AgentRequests
                    .FirstOrDefaultAsync(r => r.Id == requestId);

                if (request == null)
                    return NotFound(new { message = "Agent request not found" });

                if (request.Status != "Pending")
                    return BadRequest(new { message = $"Cannot reject request with status: {request.Status}" });

                // Update request status
                request.Status = "Rejected";
                request.ReviewedAt = DateTime.UtcNow;
                request.ReviewedBy = adminId;
                request.RejectionReason = dto.Reason;

                await _context.SaveChangesAsync();

                // Send notification to the user with the rejection reason
                await _notificationService.NotifyAgentRequestRejected(request.UserId, request.Username, dto.Reason);

                return Ok(new
                {
                    message = "Agent request rejected",
                    requestId = request.Id,
                    userId = request.UserId
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error rejecting agent request", error = ex.Message });
            }
        }



        // DELETE: Delete agent request
        [HttpDelete("admin/agent-requests/{requestId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteAgentRequest(Guid requestId)
        {
            try
            {
                var request = await _context.AgentRequests.FindAsync(requestId);

                if (request == null)
                    return NotFound(new { message = "Agent request not found" });

                _context.AgentRequests.Remove(request);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Agent request deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting agent request", error = ex.Message });
            }
        }

        [HttpPost("register")]
        public async Task<ActionResult<TokenResponseDto>> Register(UserDto registry)
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(registry.Username))
                return BadRequest(new { message = "Username is required" });

            if (string.IsNullOrWhiteSpace(registry.Password))
                return BadRequest(new { message = "Password is required" });

            if (string.IsNullOrWhiteSpace(registry.Email))
                return BadRequest(new { message = "Email is required" });

            if (string.IsNullOrWhiteSpace(registry.PhoneNumber))
                return BadRequest(new { message = "Phone number is required" });

            var user = await _authService.RegisterAsync(registry);
            if (user is null)
                return BadRequest(new { message = "Username, email, or phone number is already taken" });

            // Generate tokens immediately after registration
            var accessToken = CreateToken(user);
            var refreshToken = await GenerateAndSaveRefreshToken(user);

            return Ok(new TokenResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken
            });
        }




        [HttpPost("request-agent-role")]
        [Authorize]
        public async Task<IActionResult> RequestAgentRole()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var user = await _context.Userss.FindAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                if (user.Role == "Agent")
                    return BadRequest(new { message = "You are already an agent" });

                if (user.Role == "Admin")
                    return BadRequest(new { message = "Admins cannot request agent role" });

                // Check if there's already a pending request
                var existingRequest = await _context.AgentRequests
                    .FirstOrDefaultAsync(r => r.UserId == userId && r.Status == "Pending");

                if (existingRequest != null)
                    return BadRequest(new { message = "You already have a pending agent request" });

                // Create new agent request
                var agentRequest = new AgentRequest
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Username = user.Username ?? "",
                    Email = user.Email ?? "",
                    PhoneNumber = user.PhoneNumber ?? "",
                    Status = "Pending",
                    RequestedAt = DateTime.UtcNow
                };

                _context.AgentRequests.Add(agentRequest);
                await _context.SaveChangesAsync();

                // Notify all admins about the new agent request
                await _notificationService.NotifyAdminsNewAgentRequest(user.Username ?? "", user.Email ?? "");

                return Ok(new
                {
                    message = "Agent role request submitted. An administrator will review your request.",
                    requestId = agentRequest.Id,
                    userId = user.Id,
                    currentRole = user.Role
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error submitting agent request", error = ex.Message });
            }
        }


        //Casual Login (Phone App)
        [HttpPost("login")]
        public async Task<ActionResult<TokenResponseDto>> Login(UserDto login)
        {
            var result = await _authService.LoginAsync(login);
            if (result is null)
                return BadRequest("Invalid username or password.");
            return Ok(result);
        }


        // Login with 2FA Code (Phone App)
        [HttpPost("login-with-2fa")]
        public async Task<ActionResult<TokenResponseDto>> LoginWith2FA(LoginWith2FACodeDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Username))
                return BadRequest(new { message = "Username is required" });

            if (string.IsNullOrWhiteSpace(request.Code))
                return BadRequest(new { message = "Verification code is required" });

            var result = await _authService.LoginWith2FAAsync(request);

            if (result is null)
                return BadRequest(new { message = "Invalid or expired verification code" });

            return Ok(result);
        }


        //Admin Panel Login
        [HttpPost("admin-login")]
        public async Task<ActionResult<TokenResponseDto>> AdminLogin(UserDto login)
        {
            if (string.IsNullOrWhiteSpace(login.Username))
                return BadRequest(new { message = "Username is required" });

            if (string.IsNullOrWhiteSpace(login.Password))
                return BadRequest(new { message = "Password is required" });

            var result = await _authService.AdminLoginAsync(login);

            if (result is null)
                return BadRequest(new { message = "Invalid credentials or insufficient permissions" });

            return Ok(result);
        }


        // Google OAuth Login

        [HttpPost("google")]
     
        public async Task<ActionResult<TokenResponseDto>> GoogleLogin([FromBody] GoogleLoginDto request)
        {
            try
            {
                // Verify the Google token
                var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { _configuration["Google:ClientId"]! }
                });

                if (payload == null)
                {
                    return Unauthorized("Invalid Google token");
                }

                // Check if user exists by GoogleId
                var user = await _context.Userss.FirstOrDefaultAsync(u => u.GoogleId == payload.Subject);

                if (user == null)
                {
                    // Check if user with this email already exists (from traditional registration)
                    user = await _context.Userss.FirstOrDefaultAsync(u => u.Email == payload.Email);

                    if (user != null)
                    {
                        // Check if existing user is banned
                        if (user.IsBanned)
                        {
                            return Ok(new TokenResponseDto
                            {
                                AccessToken = null,
                                RefreshToken = null,
                                IsBanned = true,
                                BanReason = user.BanReason,
                                Message = "Your account has been banned."
                            });
                        }

                        // Link Google account to existing user
                        user.GoogleId = payload.Subject;
                        user.ProfilePictureUrl = payload.Picture;
                    }
                    else
                    {
                        // Create new user
                        user = new User
                        {
                            GoogleId = payload.Subject,
                            Email = payload.Email,
                            Username = payload.Name ?? payload.Email,
                            ProfilePictureUrl = payload.Picture,
                            Role = "User"
                        };
                        _context.Userss.Add(user);
                    }

                    await _context.SaveChangesAsync();
                }
                else
                {
                    // Existing Google user - check if banned
                    if (user.IsBanned)
                    {
                        return Ok(new TokenResponseDto
                        {
                            AccessToken = null,
                            RefreshToken = null,
                            IsBanned = true,
                            BanReason = user.BanReason,
                            Message = "Your account has been banned."
                        });
                    }
                }

                // Generate JWT token
                var token = CreateToken(user);
                var refreshToken = await GenerateAndSaveRefreshToken(user);

                return Ok(new TokenResponseDto
                {
                    AccessToken = token,
                    RefreshToken = refreshToken
                });
            }
            catch (InvalidJwtException ex)
            {
                return Unauthorized($"Invalid Google token: {ex.Message}");
            }
            catch (Exception ex)
            {
                return BadRequest($"Google authentication failed: {ex.Message}");
            }
           
        }



        //Ensure the user is authenticated
        [Authorize]
        [HttpGet("authenticated")]
        public IActionResult AuthenticatedOnlyEndpoint()
        {
            return Ok("You are authenticated!");
        }


        //Ensure the user is an admin
        [Authorize(Roles = "Admin")]
        [HttpGet("admin-only")]
        public IActionResult AdminOnlyEndpoint()
        {
            return Ok("You are an admin!");
        }



        // Generates refresh tokens for every signed-in user
        [HttpPost("refresh-tokens")]
        public async Task<ActionResult<TokenResponseDto>> RefreshTokens(RefreshTokenRequestDto request)
        {
            var result = await _authService.RefreshTokensAsync(request);
            if (result is null)
                return BadRequest("Invalid refresh token.");
            return Ok(result);
        }


        // Create JWT Token for authenticated user
        private string CreateToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["AppSettings:Token"]!));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512);
            var tokenDescriptor = new JwtSecurityToken(
                issuer: _configuration["AppSettings:Issuer"],
                audience: _configuration["AppSettings:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: creds
            );
            return new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
        }


        // Generate and save refresh token to user
        private async Task<string> GenerateAndSaveRefreshToken(User user)
        {
            var refreshToken = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _context.SaveChangesAsync();
            return refreshToken;
        }



        //Get who the current loged in user is 
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var user = await _context.Userss.FindAsync(userId);

                if (user == null)
                    return NotFound(new { message = "User not found" });

                // Check if user is banned
                if (user.IsBanned)
                {
                    return Ok(new
                    {
                        id = user.Id,
                        username = user.Username,
                        email = user.Email,
                        isBanned = true,
                        banReason = user.BanReason,
                        bannedAt = user.BannedAt
                    });
                }

                // Return agent-specific info if user is an agent
                return Ok(new
                {
                    id = user.Id,
                    username = user.Username,
                    email = user.Email,
                    phoneNumber = user.PhoneNumber,
                    role = user.Role,
                    profilePictureUrl = user.ProfilePictureUrl,
                    isAgent = user.Role == "Agent",
                    isAdmin = user.Role == "Admin",
                    canCreateProperties = user.Role == "Agent" || user.Role == "Admin",
                    isBanned = false
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving user", error = ex.Message });
            }
        }



        //Upload profile picture with Cloudinary API
        [HttpPost("upload-profile-picture")]
        [ApiExplorerSettings(IgnoreApi = true)]
        [Authorize]
        public async Task<IActionResult> UploadProfilePicture([FromForm] IFormFile file)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var user = await _context.Userss.FindAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                // Validate file
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "No file uploaded" });

                // Validate file type
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(extension))
                    return BadRequest(new { message = "Invalid file type" });

                // Validate file size (5MB max)
                if (file.Length > 5 * 1024 * 1024)
                    return BadRequest(new { message = "File size must be less than 5MB" });

                // Upload to Cloudinary
                var cloudinaryService = HttpContext.RequestServices.GetRequiredService<ICloudinaryService>();
                var imageUrl = await cloudinaryService.UploadImageAsync(file, "restate/profiles");

                // Delete old image from Cloudinary if exists
                if (!string.IsNullOrEmpty(user.ProfilePictureUrl) &&
                    user.ProfilePictureUrl.Contains("cloudinary"))
                {
                    // Extract public_id from URL
                    var uri = new Uri(user.ProfilePictureUrl);
                    var segments = uri.Segments;
                    var publicId = string.Join("", segments.Skip(segments.Length - 2)).Replace("/", "").Split('.')[0];
                    await cloudinaryService.DeleteImageAsync($"restate/profiles/{publicId}");
                }

                // Update user profile picture URL
                user.ProfilePictureUrl = imageUrl;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Profile picture uploaded successfully",
                    profilePictureUrl = user.ProfilePictureUrl
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error uploading profile picture", error = ex.Message });
            }
        }


        // PUT: api/auth/update-profile
        [HttpPut("update-profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var user = await _context.Userss.FindAsync(userId);

                if (user == null)
                    return NotFound(new { message = "User not found" });

                // Check if username is already taken by another user
                if (!string.IsNullOrWhiteSpace(dto.Username) && dto.Username != user.Username)
                {
                    var usernameExists = await _context.Userss
                        .AnyAsync(u => u.Username.ToLower() == dto.Username.ToLower() && u.Id != userId);

                    if (usernameExists)
                        return BadRequest(new { message = "Username is already taken" });

                    user.Username = dto.Username.Trim();
                }

                // Check if email is already taken by another user
                if (!string.IsNullOrWhiteSpace(dto.Email) && dto.Email != user.Email)
                {
                    var emailExists = await _context.Userss
                        .AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower() && u.Id != userId);

                    if (emailExists)
                        return BadRequest(new { message = "Email is already taken" });

                    user.Email = dto.Email.Trim();
                }

                //Check if phone number is already taken by another user
                if (!string.IsNullOrWhiteSpace(dto.PhoneNumber) && dto.PhoneNumber != user.PhoneNumber)
                {
                    var phoneExists = await _context.Userss
                        .AnyAsync(u => u.PhoneNumber == dto.PhoneNumber && u.Id != userId);

                    if (phoneExists)
                        return BadRequest(new { message = "Phone number is already taken" });

                    user.PhoneNumber = dto.PhoneNumber.Trim();
                }


                if (!string.IsNullOrEmpty(dto.PhoneNumber))
                {
                    // Remove spaces for validation
                    var cleanPhone = dto.PhoneNumber.Replace(" ", "").Replace("-", "");

                    if (!cleanPhone.StartsWith("+"))
                    {
                        return BadRequest(new { message = "Phone number must include country code (e.g., +355 for Albania, +49 for Germany)" });
                    }

                    // Store the cleaned version
                    user.PhoneNumber = cleanPhone;
                }

                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Profile updated successfully",
                    user = new
                    {
                        id = user.Id,
                        username = user.Username,
                        email = user.Email,
                        phoneNumber = user.PhoneNumber,
                        role = user.Role,
                        profilePictureUrl = user.ProfilePictureUrl,
                        createdAt = user.CreatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating profile", error = ex.Message });
            }
        }


        // PUT: api/auth/change-password
        [HttpPut("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var user = await _context.Userss.FindAsync(userId);

                if (user == null)
                    return NotFound(new { message = "User not found" });

                var passwordHasher = new PasswordHasher<User>();

                // Verify current password
                var verificationResult = passwordHasher.VerifyHashedPassword(
                    user,
                    user.PasswordHash,
                    dto.CurrentPassword
                );

                if (verificationResult == PasswordVerificationResult.Failed)
                    return BadRequest(new { message = "Current password is incorrect" });

                // Validate new password
                if (dto.NewPassword.Length < 6)
                    return BadRequest(new { message = "New password must be at least 6 characters long" });

                // Hash and update password
                user.PasswordHash = passwordHasher.HashPassword(user, dto.NewPassword);
                user.UpdatedAt = DateTime.UtcNow;

                // Optionally invalidate refresh tokens to force re-login on other devices
                user.RefreshToken = null;
                user.RefreshTokenExpiryTime = null;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Password changed successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error changing password", error = ex.Message });
            }
        }


        // DELETE: api/auth/delete-account
        [HttpDelete("delete-account")]
        [Authorize]
        public async Task<IActionResult> DeleteAccount()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var user = await _context.Userss
                    .Include(u => u.Properties)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                    return NotFound(new { message = "User not found" });

                // Delete all user's properties and their images from Cloudinary
                if (user.Properties != null && user.Properties.Any())
                {
                    foreach (var property in user.Properties)
                    {
                        // Delete images from Cloudinary
                        foreach (var imageUrl in property.Images)
                        {
                            if (imageUrl.Contains("cloudinary"))
                            {
                                try
                                {
                                    var uri = new Uri(imageUrl);
                                    var segments = uri.Segments;
                                    var publicId = string.Join("", segments.Skip(segments.Length - 2))
                                        .Replace("/", "")
                                        .Split('.')[0];
                                    await _cloudinaryService.DeleteImageAsync($"restate/properties/{publicId}");
                                }
                                catch (Exception ex)
                                {
                                    Console.WriteLine($"Error deleting image: {ex.Message}");
                                }
                            }
                        }
                    }

                    // Remove properties
                    _context.Properties.RemoveRange(user.Properties);
                }

                // Delete user's profile picture from Cloudinary if exists
                if (!string.IsNullOrEmpty(user.ProfilePictureUrl) && user.ProfilePictureUrl.Contains("cloudinary"))
                {
                    try
                    {
                        var uri = new Uri(user.ProfilePictureUrl);
                        var segments = uri.Segments;
                        var publicId = string.Join("", segments.Skip(segments.Length - 2))
                            .Replace("/", "")
                            .Split('.')[0];
                        await _cloudinaryService.DeleteImageAsync($"restate/profiles/{publicId}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error deleting profile picture: {ex.Message}");
                    }
                }

                // Delete the user
                _context.Userss.Remove(user);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Account deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting account", error = ex.Message });
            }
        }


        // GET: api/auth/stats
        [HttpGet("stats")]
        [Authorize]
        public async Task<IActionResult> GetUserStats()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var user = await _context.Userss.FindAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                // Count user's properties
                var propertyCount = await _context.Properties
                    .Where(p => p.UserId == userId)
                    .CountAsync();

                return Ok(new
                {
                    propertyCount = propertyCount,
                    memberSince = user.CreatedAt.Year,
                    joinedDate = user.CreatedAt
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving stats", error = ex.Message });
            }
        }



        [HttpPost("admin/approve-agent/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveAgentRole(Guid userId)
        {
            try
            {
                var user = await _context.Userss.FindAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                if (user.Role == "Agent")
                    return BadRequest(new { message = "User is already an agent" });

                if (user.Role == "Admin")
                    return BadRequest(new { message = "Cannot change admin role to agent" });

                user.Role = "Agent";
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"User {user.Username} has been promoted to Agent",
                    userId = user.Id,
                    username = user.Username,
                    newRole = user.Role
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error approving agent", error = ex.Message });
            }
        }


        [HttpPost("admin/revoke-agent/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RevokeAgentRole(Guid userId)
        {
            try
            {
                var user = await _context.Userss.FindAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                if (user.Role != "Agent")
                    return BadRequest(new { message = "User is not an agent" });

                user.Role = "User";
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"Agent role revoked for {user.Username}",
                    userId = user.Id,
                    username = user.Username,
                    newRole = user.Role
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error revoking agent role", error = ex.Message });
            }
        }


        // POST: Ban a user
        [HttpPost("admin/ban-user/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> BanUser(Guid userId, [FromBody] BanUserDto dto)
        {
            try
            {
                var adminIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(adminIdString) || !Guid.TryParse(adminIdString, out Guid adminId))
                    return Unauthorized(new { message = "Admin not authenticated" });

                var user = await _context.Userss.FindAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                if (user.Role == "Admin")
                    return BadRequest(new { message = "Cannot ban an administrator" });

                if (user.IsBanned)
                    return BadRequest(new { message = "User is already banned" });

                user.IsBanned = true;
                user.BanReason = dto?.Reason ?? "Violation of terms of service";
                user.BannedAt = DateTime.UtcNow;
                user.BannedBy = adminId;
                user.UpdatedAt = DateTime.UtcNow;

                // Invalidate user's refresh token to force logout
                user.RefreshToken = null;
                user.RefreshTokenExpiryTime = null;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"User {user.Username} has been banned",
                    userId = user.Id,
                    username = user.Username,
                    banReason = user.BanReason,
                    bannedAt = user.BannedAt
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error banning user", error = ex.Message });
            }
        }


        // POST: Unban a user
        [HttpPost("admin/unban-user/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UnbanUser(Guid userId)
        {
            try
            {
                var user = await _context.Userss.FindAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                if (!user.IsBanned)
                    return BadRequest(new { message = "User is not banned" });

                user.IsBanned = false;
                user.BanReason = null;
                user.BannedAt = null;
                user.BannedBy = null;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"User {user.Username} has been unbanned",
                    userId = user.Id,
                    username = user.Username
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error unbanning user", error = ex.Message });
            }
        }


        public class BanUserDto
        {
            public string? Reason { get; set; }
        }





        public class RejectAgentRequestDto
        {
            public string Reason { get; set; }
        }

    }
}