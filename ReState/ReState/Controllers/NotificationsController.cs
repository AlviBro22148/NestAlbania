using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReState.Data;
using ReState.Entities;
using ReState.Models;
using ReState.Services;
using System.Security.Claims;

namespace ReState.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IPushNotificationService _pushNotificationService;
        private readonly ILogger<NotificationsController> _logger;

        public NotificationsController(
            ApplicationDbContext context,
            INotificationService notificationService,
            IPushNotificationService pushNotificationService,
            ILogger<NotificationsController> logger)
        {
            _context = context;
            _notificationService = notificationService;
            _pushNotificationService = pushNotificationService;
            _logger = logger;
        }

        // GET: api/notifications
        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] bool unreadOnly = false)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var notifications = await _notificationService.GetUserNotifications(userId, unreadOnly);

                var response = notifications.Select(n => new
                {
                    id = n.Id,
                    propertyId = n.PropertyId,
                    type = n.Type,
                    title = n.Title,
                    message = n.Message,
                    isRead = n.IsRead,
                    createdAt = n.CreatedAt,
                    property = n.Property != null ? new
                    {
                        id = n.Property.Id,
                        title = n.Property.Title,
                        price = n.Property.Price,
                        image = n.Property.Images.FirstOrDefault()
                    } : null
                });

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching notifications: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching notifications", error = ex.Message });
            }
        }

        // GET: api/notifications/unread-count
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var count = await _context.Notifications
                    .Where(n => n.UserId == userId && !n.IsRead)
                    .CountAsync();

                return Ok(new { unreadCount = count });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching unread count: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching unread count", error = ex.Message });
            }
        }

        // PUT: api/notifications/{id}/read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                await _notificationService.MarkAsRead(id, userId);
                return Ok(new { message = "Notification marked as read" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error marking notification as read: {ex.Message}");
                return StatusCode(500, new { message = "Error updating notification", error = ex.Message });
            }
        }

        // PUT: api/notifications/read-all
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                await _notificationService.MarkAllAsRead(userId);
                return Ok(new { message = "All notifications marked as read" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error marking all as read: {ex.Message}");
                return StatusCode(500, new { message = "Error updating notifications", error = ex.Message });
            }
        }

        // GET: api/notifications/preferences
        [HttpGet("preferences")]
        public async Task<IActionResult> GetPreferences()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var prefs = await _context.NotificationPreferences
                    .FirstOrDefaultAsync(np => np.UserId == userId);

                if (prefs == null)
                {
                    // Create default preferences
                    prefs = new NotificationPreference
                    {
                        UserId = userId,
                        PriceChangeAlerts = true,
                        StatusChangeAlerts = true,
                        NewPropertyAlerts = false
                    };
                    _context.NotificationPreferences.Add(prefs);
                    await _context.SaveChangesAsync();
                }

                return Ok(new
                {
                    priceChangeAlerts = prefs.PriceChangeAlerts,
                    statusChangeAlerts = prefs.StatusChangeAlerts,
                    newPropertyAlerts = prefs.NewPropertyAlerts,
                    maxPrice = prefs.MaxPrice,
                    minBedrooms = prefs.MinBedrooms,
                    preferredCity = prefs.PreferredCity
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching preferences: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching preferences", error = ex.Message });
            }
        }

        // PUT: api/notifications/preferences
        [HttpPut("preferences")]
        public async Task<IActionResult> UpdatePreferences([FromBody] NotificationPreferenceDto dto)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var prefs = await _context.NotificationPreferences
                    .FirstOrDefaultAsync(np => np.UserId == userId);

                if (prefs == null)
                {
                    prefs = new NotificationPreference { UserId = userId };
                    _context.NotificationPreferences.Add(prefs);
                }

                prefs.PriceChangeAlerts = dto.PriceChangeAlerts;
                prefs.StatusChangeAlerts = dto.StatusChangeAlerts;
                prefs.NewPropertyAlerts = dto.NewPropertyAlerts;
                prefs.MaxPrice = dto.MaxPrice;
                prefs.MinBedrooms = dto.MinBedrooms;
                prefs.PreferredCity = dto.PreferredCity;
                prefs.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Preferences updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating preferences: {ex.Message}");
                return StatusCode(500, new { message = "Error updating preferences", error = ex.Message });
            }
        }

        // DELETE: api/notifications/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

                if (notification == null)
                    return NotFound(new { message = "Notification not found" });

                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Notification deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting notification: {ex.Message}");
                return StatusCode(500, new { message = "Error deleting notification", error = ex.Message });
            }
        }

        // POST: api/notifications/push-token
        [HttpPost("push-token")]
        public async Task<IActionResult> SavePushToken([FromBody] PushTokenDto dto)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                if (string.IsNullOrEmpty(dto.Token))
                    return BadRequest(new { message = "Token is required" });

                _logger.LogInformation($"[SavePushToken] ========== START ==========");
                _logger.LogInformation($"[SavePushToken] UserId from JWT: {userId}");
                _logger.LogInformation($"[SavePushToken] Token: {dto.Token.Substring(0, Math.Min(40, dto.Token.Length))}...");

                // STEP 1: Find ALL tokens matching this token string (there should only be one, but let's be safe)
                var existingTokens = await _context.PushTokens
                    .Where(pt => pt.Token == dto.Token)
                    .ToListAsync();

                _logger.LogInformation($"[SavePushToken] Found {existingTokens.Count} existing token(s) with this token string");

                if (existingTokens.Any())
                {
                    // Remove all duplicates, keep only one
                    if (existingTokens.Count > 1)
                    {
                        _logger.LogWarning($"[SavePushToken] Multiple tokens found! Removing duplicates...");
                        var toRemove = existingTokens.Skip(1).ToList();
                        _context.PushTokens.RemoveRange(toRemove);
                    }

                    var existingToken = existingTokens.First();
                    var previousOwner = existingToken.UserId;

                    _logger.LogInformation($"[SavePushToken] Existing token owned by: {previousOwner}");
                    _logger.LogInformation($"[SavePushToken] Reassigning to: {userId}");

                    // Update the token to belong to the new user
                    existingToken.UserId = userId;
                    existingToken.Platform = dto.Platform ?? existingToken.Platform;
                    existingToken.DeviceName = dto.DeviceName ?? existingToken.DeviceName;
                    existingToken.IsActive = true;
                    existingToken.LastUsedAt = DateTime.UtcNow;

                    // Explicitly mark as modified
                    _context.Entry(existingToken).State = EntityState.Modified;
                }
                else
                {
                    _logger.LogInformation($"[SavePushToken] No existing token - Creating new one for user {userId}");

                    var pushToken = new PushToken
                    {
                        UserId = userId,
                        Token = dto.Token,
                        Platform = dto.Platform ?? "unknown",
                        DeviceName = dto.DeviceName,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        LastUsedAt = DateTime.UtcNow
                    };
                    _context.PushTokens.Add(pushToken);
                }

                // Save changes
                var saveResult = await _context.SaveChangesAsync();
                _logger.LogInformation($"[SavePushToken] SaveChangesAsync: {saveResult} rows affected");

                // VERIFY the save worked by re-querying
                var verifyToken = await _context.PushTokens
                    .AsNoTracking()
                    .FirstOrDefaultAsync(pt => pt.Token == dto.Token);

                if (verifyToken != null)
                {
                    _logger.LogInformation($"[SavePushToken] VERIFIED - Token now belongs to: {verifyToken.UserId}");

                    if (verifyToken.UserId != userId)
                    {
                        _logger.LogError($"[SavePushToken] ERROR: Token still belongs to wrong user! Expected {userId}, got {verifyToken.UserId}");
                    }
                }
                else
                {
                    _logger.LogError($"[SavePushToken] ERROR: Token not found after save!");
                }

                _logger.LogInformation($"[SavePushToken] ========== END ==========");

                return Ok(new {
                    message = "Push token saved successfully",
                    assignedToUser = userId,
                    tokenId = verifyToken?.Id
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[SavePushToken] EXCEPTION: {ex.Message}\nStackTrace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Error saving push token", error = ex.Message });
            }
        }

        // DELETE: api/notifications/push-token
        [HttpDelete("push-token")]
        public async Task<IActionResult> RemovePushToken([FromBody] RemovePushTokenDto dto)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var pushToken = await _context.PushTokens
                    .FirstOrDefaultAsync(pt => pt.Token == dto.Token && pt.UserId == userId);

                if (pushToken != null)
                {
                    // Mark as inactive instead of deleting (soft delete)
                    pushToken.IsActive = false;
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Push token deactivated for user {userId}");
                }

                return Ok(new { message = "Push token removed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error removing push token: {ex.Message}");
                return StatusCode(500, new { message = "Error removing push token", error = ex.Message });
            }
        }

        // GET: api/notifications/push-tokens
        [HttpGet("push-tokens")]
        public async Task<IActionResult> GetPushTokens()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var tokens = await _context.PushTokens
                    .Where(pt => pt.UserId == userId && pt.IsActive)
                    .Select(pt => new
                    {
                        id = pt.Id,
                        platform = pt.Platform,
                        deviceName = pt.DeviceName,
                        createdAt = pt.CreatedAt,
                        lastUsedAt = pt.LastUsedAt
                    })
                    .ToListAsync();

                return Ok(new { tokens, pushEnabled = tokens.Any() });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching push tokens: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching push tokens", error = ex.Message });
            }
        }

        // DELETE: api/notifications/debug-clear-all-tokens (for debugging - clears all tokens)
        [HttpDelete("debug-clear-all-tokens")]
        public async Task<IActionResult> DebugClearAllTokens()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                // Only allow admin to clear all tokens
                var user = await _context.Userss.FindAsync(userId);
                if (user?.Role != "Admin")
                    return Forbid("Only admins can clear all tokens");

                var allTokens = await _context.PushTokens.ToListAsync();
                var count = allTokens.Count;

                _context.PushTokens.RemoveRange(allTokens);
                await _context.SaveChangesAsync();

                _logger.LogWarning($"[DEBUG] All {count} push tokens cleared by admin {userId}");

                return Ok(new { message = $"Cleared {count} push tokens", clearedCount = count });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error clearing tokens: {ex.Message}");
                return StatusCode(500, new { message = "Error", error = ex.Message });
            }
        }

        // GET: api/notifications/debug-tokens (ADMIN ONLY - for debugging)
        [HttpGet("debug-tokens")]
        public async Task<IActionResult> DebugAllTokens()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                // Get all tokens with user info
                var tokens = await _context.PushTokens
                    .Include(pt => pt.User)
                    .Where(pt => pt.IsActive)
                    .Select(pt => new
                    {
                        tokenId = pt.Id,
                        tokenPrefix = pt.Token.Substring(0, Math.Min(40, pt.Token.Length)) + "...",
                        userId = pt.UserId,
                        username = pt.User != null ? pt.User.Username : "Unknown",
                        userRole = pt.User != null ? pt.User.Role : "Unknown",
                        platform = pt.Platform,
                        deviceName = pt.DeviceName,
                        createdAt = pt.CreatedAt,
                        lastUsedAt = pt.LastUsedAt
                    })
                    .ToListAsync();

                return Ok(new {
                    currentUserId = userId,
                    totalActiveTokens = tokens.Count,
                    tokens
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error debugging tokens: {ex.Message}");
                return StatusCode(500, new { message = "Error", error = ex.Message });
            }
        }

        // POST: api/notifications/test-push
        // Send a test push notification to yourself
        [HttpPost("test-push")]
        public async Task<IActionResult> SendTestPushNotification()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                // Check if user has any active push tokens
                var hasTokens = await _context.PushTokens
                    .AnyAsync(pt => pt.UserId == userId && pt.IsActive);

                if (!hasTokens)
                {
                    return BadRequest(new { message = "No active push tokens found. Make sure you've enabled notifications in the app." });
                }

                // Send test notification
                await _pushNotificationService.SendPushNotificationAsync(
                    userId,
                    "Test Notification",
                    "If you see this, push notifications are working!",
                    new { type = "test", timestamp = DateTime.UtcNow }
                );

                _logger.LogInformation($"Test push notification sent to user {userId}");

                return Ok(new { message = "Test notification sent! Check your device." });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending test push notification: {ex.Message}");
                return StatusCode(500, new { message = "Error sending test notification", error = ex.Message });
            }
        }
    }
}

// DTOs for push token endpoints
public class PushTokenDto
{
    public string Token { get; set; } = string.Empty;
    public string? Platform { get; set; }
    public string? DeviceName { get; set; }
}

public class RemovePushTokenDto
{
    public string Token { get; set; } = string.Empty;
}