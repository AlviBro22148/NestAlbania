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

        public NotificationService(ApplicationDbContext context, ILogger<NotificationService> logger)
        {
            _context = context;
            _logger = logger;
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
                        var notification = new Notification
                        {
                            UserId = userId,
                            PropertyId = propertyId,
                            Type = "PriceChange",
                            Title = newPrice < oldPrice ? "Price Drop Alert! 📉" : "Price Change Alert 💰",
                            Message = $"{property.Title} - Price changed from ${oldPrice:N0} to ${newPrice:N0}",
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.Notifications.Add(notification);
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
                        var emoji = newStatus == "Sold" ? "🔴" : newStatus == "Pending" ? "🟡" : "🟢";
                        var notification = new Notification
                        {
                            UserId = userId,
                            PropertyId = propertyId,
                            Type = "StatusChange",
                            Title = $"Status Update {emoji}",
                            Message = $"{property.Title} - Status changed from {oldStatus} to {newStatus}",
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.Notifications.Add(notification);
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
                    var notification = new Notification
                    {
                        UserId = userId,
                        PropertyId = property.Id,
                        Type = "NewProperty",
                        Title = "New Property Match! 🏠",
                        Message = $"{property.Title} - ${property.Price:N0} in {property.City}",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Notifications.Add(notification);
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
                var notification = new Notification
                {
                    UserId = userId,
                    PropertyId = null,
                    Type = "AgentRequestApproved",
                    Title = "Agent Request Approved!",
                    Message = $"Congratulations {username}! Your request to become an agent has been approved. You can now list properties on the platform.",
                    CreatedAt = DateTime.UtcNow
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Agent approval notification sent to user {userId}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending agent approval notification: {ex.Message}");
            }
        }

        public async Task NotifyAgentRequestRejected(Guid userId, string username, string reason)
        {
            try
            {
                var notification = new Notification
                {
                    UserId = userId,
                    PropertyId = null,
                    Type = "AgentRequestRejected",
                    Title = "Agent Request Update",
                    Message = $"Hi {username}, your request to become an agent was not approved. Reason: {reason}",
                    CreatedAt = DateTime.UtcNow
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
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
                var notification = new Notification
                {
                    UserId = userId,
                    PropertyId = null,
                    Type = "FeedbackResolved",
                    Title = "Feedback Resolved ✅",
                    Message = $"Thank you {username}! Your feedback \"{feedbackSubject}\" has been reviewed and resolved. We truly appreciate you taking the time to help us improve NestAlbania!",
                    CreatedAt = DateTime.UtcNow
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
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
                        Title = "New Agent Request 👤",
                        Message = $"{username} ({email}) has submitted a request to become an agent. Please review their application.",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Notifications.Add(notification);
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
                        Title = $"New {feedbackType} 📝",
                        Message = $"{username} submitted feedback: \"{subject}\"",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Notifications.Add(notification);
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