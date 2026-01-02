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
        private readonly ILogger<NotificationsController> _logger;

        public NotificationsController(
            ApplicationDbContext context,
            INotificationService notificationService,
            ILogger<NotificationsController> logger)
        {
            _context = context;
            _notificationService = notificationService;
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
    }
}