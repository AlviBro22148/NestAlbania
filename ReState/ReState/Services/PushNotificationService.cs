using Microsoft.EntityFrameworkCore;
using ReState.Data;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ReState.Services
{
    public interface IPushNotificationService
    {
        Task SendPushNotificationAsync(Guid userId, string title, string body, object? data = null);
        Task SendPushNotificationToTokenAsync(string token, string title, string body, object? data = null);
        Task SendChatNotificationAsync(Guid recipientId, string senderName, string messagePreview, int conversationId);
    }

    public class PushNotificationService : IPushNotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PushNotificationService> _logger;
        private readonly HttpClient _httpClient;
        private const string ExpoPushUrl = "https://exp.host/--/api/v2/push/send";

        public PushNotificationService(
            ApplicationDbContext context,
            ILogger<PushNotificationService> logger,
            IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient("ExpoPush");
        }

        /// <summary>
        /// Send a push notification to all active devices for a user
        /// </summary>
        public async Task SendPushNotificationAsync(Guid userId, string title, string body, object? data = null)
        {
            try
            {
                _logger.LogInformation($"[PushNotification] ========== SENDING NOTIFICATION ==========");
                _logger.LogInformation($"[PushNotification] Target User: {userId}");
                _logger.LogInformation($"[PushNotification] Title: {title}");

                // Get all active push tokens for this user
                var tokens = await _context.PushTokens
                    .Where(pt => pt.UserId == userId && pt.IsActive)
                    .ToListAsync();

                if (!tokens.Any())
                {
                    _logger.LogWarning($"[PushNotification] NO TOKENS found for user {userId}");
                    _logger.LogInformation($"[PushNotification] ========== END (NO TOKENS) ==========");
                    return;
                }

                _logger.LogInformation($"[PushNotification] Found {tokens.Count} token(s):");
                foreach (var t in tokens)
                {
                    _logger.LogInformation($"[PushNotification]   - Token ID: {t.Id}, Platform: {t.Platform}, Device: {t.DeviceName}");
                }

                // Send to all devices
                foreach (var token in tokens)
                {
                    await SendPushNotificationToTokenAsync(token.Token, title, body, data);
                }

                _logger.LogInformation($"[PushNotification] ========== END (SENT TO {tokens.Count} DEVICE(S)) ==========");
            }
            catch (Exception ex)
            {
                _logger.LogError($"[PushNotification] ERROR: {ex.Message}");
            }
        }

        /// <summary>
        /// Send a push notification to a specific Expo push token
        /// </summary>
        public async Task SendPushNotificationToTokenAsync(string token, string title, string body, object? data = null)
        {
            try
            {
                // Validate token format (Expo tokens start with "ExponentPushToken[" or "ExpoPushToken[")
                if (!token.StartsWith("ExponentPushToken[") && !token.StartsWith("ExpoPushToken["))
                {
                    _logger.LogWarning($"Invalid Expo push token format: {token.Substring(0, Math.Min(20, token.Length))}...");
                    return;
                }

                // Determine channel ID from data if available
                string channelId = "default";
                if (data != null)
                {
                    var dataType = data.GetType();
                    var channelProp = dataType.GetProperty("channelId");
                    if (channelProp != null)
                    {
                        channelId = channelProp.GetValue(data)?.ToString() ?? "default";
                    }
                }

                _logger.LogInformation($"[PushToToken] Sending to token: {token.Substring(0, 30)}... Channel: {channelId}");

                var message = new ExpoPushMessage
                {
                    To = token,
                    Title = title,
                    Body = body,
                    Sound = "default",
                    Data = data,
                    Priority = "high",
                    ChannelId = channelId
                };

                var response = await _httpClient.PostAsJsonAsync(ExpoPushUrl, message, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
                });

                var responseBody = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"[PushToToken] Expo response: {response.StatusCode} - {responseBody}");

                if (response.IsSuccessStatusCode)
                {
                    // Check if Expo returned an error in the response body
                    if (responseBody.Contains("\"status\":\"error\"") || responseBody.Contains("DeviceNotRegistered"))
                    {
                        _logger.LogError($"[PushToToken] Expo returned error in body: {responseBody}");
                        await DeactivateToken(token);
                    }
                    else
                    {
                        // Update last used timestamp
                        var pushToken = await _context.PushTokens.FirstOrDefaultAsync(pt => pt.Token == token);
                        if (pushToken != null)
                        {
                            pushToken.LastUsedAt = DateTime.UtcNow;
                            await _context.SaveChangesAsync();
                        }
                    }
                }
                else
                {
                    _logger.LogError($"[PushToToken] HTTP error: {response.StatusCode} - {responseBody}");

                    // If token is invalid, deactivate it
                    if (responseBody.Contains("DeviceNotRegistered") || responseBody.Contains("InvalidCredentials"))
                    {
                        await DeactivateToken(token);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending push to token: {ex.Message}");
            }
        }

        /// <summary>
        /// Send a chat message notification
        /// </summary>
        public async Task SendChatNotificationAsync(Guid recipientId, string senderName, string messagePreview, int conversationId)
        {
            _logger.LogInformation($"[ChatNotification] Sending chat notification to {recipientId} from {senderName}");

            // Truncate message preview if too long
            if (messagePreview.Length > 100)
            {
                messagePreview = messagePreview.Substring(0, 97) + "...";
            }

            var data = new
            {
                type = "chat",
                conversationId = conversationId,
                channelId = "chat"
            };

            await SendPushNotificationAsync(
                recipientId,
                $"New message from {senderName}",
                messagePreview,
                data
            );
        }

        /// <summary>
        /// Deactivate an invalid token
        /// </summary>
        private async Task DeactivateToken(string token)
        {
            try
            {
                var pushToken = await _context.PushTokens.FirstOrDefaultAsync(pt => pt.Token == token);
                if (pushToken != null)
                {
                    pushToken.IsActive = false;
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Deactivated invalid push token");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deactivating token: {ex.Message}");
            }
        }
    }

    /// <summary>
    /// Expo Push Message format
    /// </summary>
    public class ExpoPushMessage
    {
        public string To { get; set; } = string.Empty;
        public string? Title { get; set; }
        public string? Body { get; set; }
        public string? Sound { get; set; }
        public object? Data { get; set; }
        public string? Priority { get; set; }
        public string? ChannelId { get; set; }
        public int? Badge { get; set; }
        public int? Ttl { get; set; }
    }
}
