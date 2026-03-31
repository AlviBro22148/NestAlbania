using Microsoft.EntityFrameworkCore;
using ReState.Data;
using ReState.Entities;

namespace ReState.Services
{
    public interface INotificationService
    {
        Task NotifyPriceChange(int propertyId, decimal oldPrice, decimal newPrice);
        Task NotifyStatusChange(int propertyId, string oldStatus, string newStatus);
        Task NotifyNewProperty(Property property);
        Task<List<Notification>> GetUserNotifications(Guid userId, bool unreadOnly = false);
        Task MarkAsRead(int notificationId, Guid userId);
        Task MarkAllAsRead(Guid userId);
        Task NotifyAgentRequestApproved(Guid userId, string username);
        Task NotifyAgentRequestRejected(Guid userId, string username, string reason);
        Task NotifyFeedbackResolved(Guid userId, string username, string feedbackSubject);
        Task NotifyAdminsNewAgentRequest(string username, string email);
        Task NotifyAdminsNewFeedback(string username, string feedbackType, string subject);
    }

    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<NotificationService> _logger;
        private readonly IPushNotificationService _pushNotificationService;

        public NotificationService(
            ApplicationDbContext context,
            ILogger<NotificationService> logger,
            IPushNotificationService pushNotificationService)
        {
            _context = context;
            _logger = logger;
            _pushNotificationService = pushNotificationService;
        }

        public async Task NotifyPriceChange(int propertyId, decimal oldPrice, decimal newPrice)
        {
            try
            {
                var property = await _context.Properties.FindAsync(propertyId);
                if (property == null) return;

                // Record price history
                var priceHistory = new PropertyPriceHistory
                {
                    PropertyId = propertyId,
                    OldPrice = oldPrice,
                    NewPrice = newPrice,
                    ChangedAt = DateTime.UtcNow
                };
                _context.PropertyPriceHistories.Add(priceHistory);

                // Find users who liked this property
                var usersWhoLiked = await _context.LikedProperties
                    .Where(lp => lp.PropertyId == propertyId)
                    .Select(lp => lp.UserId)
                    .ToListAsync();

                foreach (var userId in usersWhoLiked)
                {
                    // Check user preferences
                    var prefs = await _context.NotificationPreferences
                        .FirstOrDefaultAsync(np => np.UserId == userId);

                    if (prefs?.PriceChangeAlerts != false) // Send if enabled or no preference set
                    {
                        var title = newPrice < oldPrice ? "Price Drop Alert!" : "Price Change Alert";
                        var message = $"{property.Title} - Price changed from ${oldPrice:N0} to ${newPrice:N0}";

                        var notification = new Notification
                        {
                            UserId = userId,
                            PropertyId = propertyId,
                            Type = "PriceChange",
                            Title = title,
                            Message = message,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.Notifications.Add(notification);

                        // Send push notification
                        await _pushNotificationService.SendPushNotificationAsync(
                            userId,
                            title,
                            message,
                            new { type = "PriceChange", propertyId = propertyId }
                        );
                    }
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Price change notifications sent for property {propertyId}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending price change notifications: {ex.Message}");
            }
        }

        public async Task NotifyStatusChange(int propertyId, string oldStatus, string newStatus)
        {
            try
            {
                var property = await _context.Properties.FindAsync(propertyId);
                if (property == null) return;

                // Find users who liked this property
                var usersWhoLiked = await _context.LikedProperties
                    .Where(lp => lp.PropertyId == propertyId)
                    .Select(lp => lp.UserId)
                    .ToListAsync();

                foreach (var userId in usersWhoLiked)
                {
                    var prefs = await _context.NotificationPreferences
                        .FirstOrDefaultAsync(np => np.UserId == userId);

                    if (prefs?.StatusChangeAlerts != false)
                    {
                        var title = "Status Update";
                        var message = $"{property.Title} - Status changed from {oldStatus} to {newStatus}";

                        var notification = new Notification
                        {
                            UserId = userId,
                            PropertyId = propertyId,
                            Type = "StatusChange",
                            Title = title,
                            Message = message,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.Notifications.Add(notification);

                        // Send push notification
                        await _pushNotificationService.SendPushNotificationAsync(
                            userId,
                            title,
                            message,
                            new { type = "StatusChange", propertyId = propertyId, newStatus = newStatus }
                        );
                    }
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Status change notifications sent for property {propertyId}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending status change notifications: {ex.Message}");
            }
        }

        public async Task NotifyNewProperty(Property property)
        {
            try
            {
                // Find users with matching preferences
                var matchingUsers = await _context.NotificationPreferences
                    .Where(np => np.NewPropertyAlerts == true)
                    .Where(np =>
                        (np.MaxPrice == null || property.Price <= np.MaxPrice) &&
                        (np.MinBedrooms == null || property.Bedrooms >= np.MinBedrooms) &&
                        (np.PreferredCity == null || property.City == np.PreferredCity)
                    )
                    .Select(np => np.UserId)
                    .ToListAsync();

                foreach (var userId in matchingUsers)
                {
                    var title = "New Property Match!";
                    var message = $"{property.Title} - ${property.Price:N0} in {property.City}";

                    var notification = new Notification
                    {
                        UserId = userId,
                        PropertyId = property.Id,
                        Type = "NewProperty",
                        Title = title,
                        Message = message,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Notifications.Add(notification);

                    // Send push notification
                    await _pushNotificationService.SendPushNotificationAsync(
                        userId,
                        title,
                        message,
                        new { type = "NewProperty", propertyId = property.Id }
                    );
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation($"New property notifications sent for property {property.Id}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending new property notifications: {ex.Message}");
            }
        }

        public async Task<List<Notification>> GetUserNotifications(Guid userId, bool unreadOnly = false)
        {
            var query = _context.Notifications
                .Include(n => n.Property)
                .Where(n => n.UserId == userId);

            if (unreadOnly)
            {
                query = query.Where(n => !n.IsRead);
            }

            return await query
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        public async Task MarkAsRead(int notificationId, Guid userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification != null)
            {
                notification.IsRead = true;
                await _context.SaveChangesAsync();
            }
        }

        public async Task MarkAllAsRead(Guid userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();
        }

        public async Task NotifyAgentRequestApproved(Guid userId, string username)
        {
            try
            {
                _logger.LogInformation($"[NotifyAgentRequestApproved] Starting for user {userId} ({username})");

                var title = "Agent Request Approved!";
                var message = $"Congratulations {username}! Your request to become an agent has been approved. You can now list properties on the platform.";

                var notification = new Notification
                {
                    UserId = userId,
                    PropertyId = null,
                    Type = "AgentRequestApproved",
                    Title = title,
                    Message = message,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"[NotifyAgentRequestApproved] In-app notification saved for user {userId}");

                // Send push notification
                _logger.LogInformation($"[NotifyAgentRequestApproved] Sending push notification to user {userId}");
                await _pushNotificationService.SendPushNotificationAsync(
                    userId,
                    title,
                    message,
                    new { type = "AgentRequestApproved" }
                );

                _logger.LogInformation($"[NotifyAgentRequestApproved] Completed for user {userId}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"[NotifyAgentRequestApproved] Error: {ex.Message}\nStackTrace: {ex.StackTrace}");
            }
        }

        public async Task NotifyAgentRequestRejected(Guid userId, string username, string reason)
        {
            try
            {
                var title = "Agent Request Update";
                var message = $"Hi {username}, your request to become an agent was not approved. Reason: {reason}";

                var notification = new Notification
                {
                    UserId = userId,
                    PropertyId = null,
                    Type = "AgentRequestRejected",
                    Title = title,
                    Message = message,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                // Send push notification
                await _pushNotificationService.SendPushNotificationAsync(
                    userId,
                    title,
                    message,
                    new { type = "AgentRequestRejected" }
                );

                _logger.LogInformation($"Agent rejection notification sent to user {userId}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending agent rejection notification: {ex.Message}");
            }
        }

        public async Task NotifyFeedbackResolved(Guid userId, string username, string feedbackSubject)
        {
            try
            {
                var title = "Feedback Resolved";
                var message = $"Thank you {username}! Your feedback \"{feedbackSubject}\" has been reviewed and resolved.";

                var notification = new Notification
                {
                    UserId = userId,
                    PropertyId = null,
                    Type = "FeedbackResolved",
                    Title = title,
                    Message = message,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                // Send push notification
                await _pushNotificationService.SendPushNotificationAsync(
                    userId,
                    title,
                    message,
                    new { type = "FeedbackResolved" }
                );

                _logger.LogInformation($"Feedback resolved notification sent to user {userId}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending feedback resolved notification: {ex.Message}");
            }
        }

        public async Task NotifyAdminsNewAgentRequest(string username, string email)
        {
            try
            {
                var title = "New Agent Request";
                var message = $"{username} ({email}) has submitted a request to become an agent. Please review their application.";

                // Get all admin users
                var adminUsers = await _context.Userss
                    .Where(u => u.Role == "Admin")
                    .Select(u => u.Id)
                    .ToListAsync();

                foreach (var adminId in adminUsers)
                {
                    var notification = new Notification
                    {
                        UserId = adminId,
                        PropertyId = null,
                        Type = "NewAgentRequest",
                        Title = title,
                        Message = message,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Notifications.Add(notification);

                    // Send push notification to admin
                    await _pushNotificationService.SendPushNotificationAsync(
                        adminId,
                        title,
                        message,
                        new { type = "NewAgentRequest" }
                    );
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Admin notifications sent for new agent request from {username}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending admin notifications for agent request: {ex.Message}");
            }
        }

        public async Task NotifyAdminsNewFeedback(string username, string feedbackType, string subject)
        {
            try
            {
                var title = $"New {feedbackType}";
                var message = $"{username} submitted feedback: \"{subject}\"";

                // Get all admin users
                var adminUsers = await _context.Userss
                    .Where(u => u.Role == "Admin")
                    .Select(u => u.Id)
                    .ToListAsync();

                foreach (var adminId in adminUsers)
                {
                    var notification = new Notification
                    {
                        UserId = adminId,
                        PropertyId = null,
                        Type = "NewFeedback",
                        Title = title,
                        Message = message,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Notifications.Add(notification);

                    // Send push notification to admin
                    await _pushNotificationService.SendPushNotificationAsync(
                        adminId,
                        title,
                        message,
                        new { type = "NewFeedback" }
                    );
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Admin notifications sent for new feedback from {username}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending admin notifications for feedback: {ex.Message}");
            }
        }
    }
}