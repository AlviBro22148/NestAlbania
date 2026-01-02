using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReState.Data;
using ReState.Entities;
using ReState.Models;
using System.Security.Claims;

namespace ReState.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ChatController> _logger;

        public ChatController(ApplicationDbContext context, ILogger<ChatController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/chat/conversations
        // filter: "active" (default), "archived"
        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations([FromQuery] string filter = "active")
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                // Get conversations where user is either the initiator (User) or the property owner (Agent)
                // Exclude deleted conversations
                var query = _context.ChatConversations
                    .Where(c => c.UserId == userId || c.AgentId == userId)
                    .Where(c => !((c.UserId == userId && c.IsDeletedByUser) || (c.AgentId == userId && c.IsDeletedByAgent)));

                // Apply filter based on user's role in the conversation
                query = filter.ToLower() switch
                {
                    "archived" => query.Where(c =>
                        (c.UserId == userId && c.IsArchivedByUser) ||
                        (c.AgentId == userId && c.IsArchivedByAgent)),
                    _ => query.Where(c =>
                        !((c.UserId == userId && c.IsArchivedByUser) || (c.AgentId == userId && c.IsArchivedByAgent)))
                };

                var conversations = await query
                    .Include(c => c.Property)
                    .Include(c => c.User)
                    .Include(c => c.Agent)
                    .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                    .OrderByDescending(c => c.UpdatedAt)
                    .ToListAsync();

                var response = conversations.Select(c =>
                {
                    var lastMessage = c.Messages.FirstOrDefault();
                    var unreadCount = _context.ChatMessages
                        .Count(m => m.ConversationId == c.Id && !m.IsRead && m.SenderId != userId);

                    return new ConversationResponseDto
                    {
                        Id = c.Id,
                        PropertyId = c.PropertyId,
                        PropertyTitle = c.Property?.Title ?? "Unknown Property",
                        PropertyImage = c.Property?.Images.FirstOrDefault(),
                        PropertyPrice = c.Property?.Price ?? 0,
                        UserId = c.UserId,
                        UserName = c.User?.Username ?? "Unknown User",
                        UserProfilePicture = c.User?.ProfilePictureUrl,
                        AgentId = c.AgentId,
                        AgentName = c.Agent?.Username ?? "Unknown Agent",
                        AgentProfilePicture = c.Agent?.ProfilePictureUrl,
                        LastMessage = lastMessage?.Content,
                        LastMessageAt = lastMessage?.CreatedAt,
                        UnreadCount = unreadCount,
                        CreatedAt = c.CreatedAt,
                        UpdatedAt = c.UpdatedAt
                    };
                });

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching conversations: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching conversations", error = ex.Message });
            }
        }

        // POST: api/chat/conversations
        [HttpPost("conversations")]
        public async Task<IActionResult> StartConversation([FromBody] StartConversationDto dto)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                if (string.IsNullOrWhiteSpace(dto.InitialMessage))
                    return BadRequest(new { message = "Initial message is required" });

                // Get the property and its owner
                var property = await _context.Properties.FindAsync(dto.PropertyId);
                if (property == null)
                    return NotFound(new { message = "Property not found" });

                var agentId = property.UserId;

                // Don't allow users to chat with themselves
                if (agentId == userId)
                    return BadRequest(new { message = "You cannot start a conversation with yourself" });

                // Check if conversation already exists
                var existingConversation = await _context.ChatConversations
                    .FirstOrDefaultAsync(c => c.UserId == userId && c.AgentId == agentId && c.PropertyId == dto.PropertyId);

                if (existingConversation != null)
                {
                    // Add message to existing conversation
                    var newMessage = new ChatMessage
                    {
                        ConversationId = existingConversation.Id,
                        SenderId = userId,
                        Content = dto.InitialMessage.Trim(),
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.ChatMessages.Add(newMessage);
                    existingConversation.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    // Reload with includes
                    existingConversation = await _context.ChatConversations
                        .Include(c => c.Property)
                        .Include(c => c.User)
                        .Include(c => c.Agent)
                        .FirstAsync(c => c.Id == existingConversation.Id);

                    return Ok(new ConversationResponseDto
                    {
                        Id = existingConversation.Id,
                        PropertyId = existingConversation.PropertyId,
                        PropertyTitle = existingConversation.Property?.Title ?? "Unknown Property",
                        PropertyImage = existingConversation.Property?.Images.FirstOrDefault(),
                        PropertyPrice = existingConversation.Property?.Price ?? 0,
                        UserId = existingConversation.UserId,
                        UserName = existingConversation.User?.Username ?? "Unknown User",
                        UserProfilePicture = existingConversation.User?.ProfilePictureUrl,
                        AgentId = existingConversation.AgentId,
                        AgentName = existingConversation.Agent?.Username ?? "Unknown Agent",
                        AgentProfilePicture = existingConversation.Agent?.ProfilePictureUrl,
                        LastMessage = dto.InitialMessage.Trim(),
                        LastMessageAt = DateTime.UtcNow,
                        UnreadCount = 0,
                        CreatedAt = existingConversation.CreatedAt,
                        UpdatedAt = existingConversation.UpdatedAt
                    });
                }

                // Create new conversation
                var conversation = new ChatConversation
                {
                    PropertyId = dto.PropertyId,
                    UserId = userId,
                    AgentId = agentId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.ChatConversations.Add(conversation);
                await _context.SaveChangesAsync();

                // Add initial message
                var message = new ChatMessage
                {
                    ConversationId = conversation.Id,
                    SenderId = userId,
                    Content = dto.InitialMessage.Trim(),
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ChatMessages.Add(message);
                await _context.SaveChangesAsync();

                // Get user and agent details
                var user = await _context.Userss.FindAsync(userId);
                var agent = await _context.Userss.FindAsync(agentId);

                return Ok(new ConversationResponseDto
                {
                    Id = conversation.Id,
                    PropertyId = conversation.PropertyId,
                    PropertyTitle = property.Title,
                    PropertyImage = property.Images.FirstOrDefault(),
                    PropertyPrice = property.Price,
                    UserId = conversation.UserId,
                    UserName = user?.Username ?? "Unknown User",
                    UserProfilePicture = user?.ProfilePictureUrl,
                    AgentId = conversation.AgentId,
                    AgentName = agent?.Username ?? "Unknown Agent",
                    AgentProfilePicture = agent?.ProfilePictureUrl,
                    LastMessage = dto.InitialMessage.Trim(),
                    LastMessageAt = message.CreatedAt,
                    UnreadCount = 0,
                    CreatedAt = conversation.CreatedAt,
                    UpdatedAt = conversation.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error starting conversation: {ex.Message}");
                return StatusCode(500, new { message = "Error starting conversation", error = ex.Message });
            }
        }

        // GET: api/chat/conversations/{id}/messages
        [HttpGet("conversations/{id}/messages")]
        public async Task<IActionResult> GetMessages(int id)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                // Verify user has access to this conversation
                var conversation = await _context.ChatConversations
                    .FirstOrDefaultAsync(c => c.Id == id && (c.UserId == userId || c.AgentId == userId));

                if (conversation == null)
                    return NotFound(new { message = "Conversation not found" });

                var messages = await _context.ChatMessages
                    .Where(m => m.ConversationId == id)
                    .Include(m => m.Sender)
                    .OrderBy(m => m.CreatedAt)
                    .ToListAsync();

                var response = messages.Select(m => new MessageResponseDto
                {
                    Id = m.Id,
                    ConversationId = m.ConversationId,
                    SenderId = m.SenderId,
                    SenderName = m.Sender?.Username ?? "Unknown",
                    SenderProfilePicture = m.Sender?.ProfilePictureUrl,
                    Content = m.Content,
                    IsRead = m.IsRead,
                    CreatedAt = m.CreatedAt
                });

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching messages: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching messages", error = ex.Message });
            }
        }

        // POST: api/chat/conversations/{id}/messages
        [HttpPost("conversations/{id}/messages")]
        public async Task<IActionResult> SendMessage(int id, [FromBody] SendMessageDto dto)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                if (string.IsNullOrWhiteSpace(dto.Content))
                    return BadRequest(new { message = "Message content is required" });

                // Verify user has access to this conversation
                var conversation = await _context.ChatConversations
                    .FirstOrDefaultAsync(c => c.Id == id && (c.UserId == userId || c.AgentId == userId));

                if (conversation == null)
                    return NotFound(new { message = "Conversation not found" });

                var message = new ChatMessage
                {
                    ConversationId = id,
                    SenderId = userId,
                    Content = dto.Content.Trim(),
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ChatMessages.Add(message);
                conversation.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var sender = await _context.Userss.FindAsync(userId);

                return Ok(new MessageResponseDto
                {
                    Id = message.Id,
                    ConversationId = message.ConversationId,
                    SenderId = message.SenderId,
                    SenderName = sender?.Username ?? "Unknown",
                    SenderProfilePicture = sender?.ProfilePictureUrl,
                    Content = message.Content,
                    IsRead = message.IsRead,
                    CreatedAt = message.CreatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending message: {ex.Message}");
                return StatusCode(500, new { message = "Error sending message", error = ex.Message });
            }
        }

        // PUT: api/chat/conversations/{id}/read
        [HttpPut("conversations/{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                // Verify user has access to this conversation
                var conversation = await _context.ChatConversations
                    .FirstOrDefaultAsync(c => c.Id == id && (c.UserId == userId || c.AgentId == userId));

                if (conversation == null)
                    return NotFound(new { message = "Conversation not found" });

                // Mark all messages from the OTHER user as read
                var unreadMessages = await _context.ChatMessages
                    .Where(m => m.ConversationId == id && m.SenderId != userId && !m.IsRead)
                    .ToListAsync();

                foreach (var message in unreadMessages)
                {
                    message.IsRead = true;
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Messages marked as read", count = unreadMessages.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error marking messages as read: {ex.Message}");
                return StatusCode(500, new { message = "Error marking messages as read", error = ex.Message });
            }
        }

        // GET: api/chat/unread-count
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                // Count unread messages in active conversations where user is a participant
                var conversationIds = await _context.ChatConversations
                    .Where(c => (c.UserId == userId || c.AgentId == userId) &&
                                !((c.UserId == userId && c.IsDeletedByUser) || (c.AgentId == userId && c.IsDeletedByAgent)))
                    .Select(c => c.Id)
                    .ToListAsync();

                var totalUnread = await _context.ChatMessages
                    .Where(m => conversationIds.Contains(m.ConversationId) && m.SenderId != userId && !m.IsRead)
                    .CountAsync();

                return Ok(new UnreadCountResponseDto { TotalUnread = totalUnread });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting unread count: {ex.Message}");
                return StatusCode(500, new { message = "Error getting unread count", error = ex.Message });
            }
        }

        // GET: api/chat/conversations/{id}
        [HttpGet("conversations/{id}")]
        public async Task<IActionResult> GetConversation(int id)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var conversation = await _context.ChatConversations
                    .Where(c => c.Id == id && (c.UserId == userId || c.AgentId == userId))
                    .Include(c => c.Property)
                    .Include(c => c.User)
                    .Include(c => c.Agent)
                    .FirstOrDefaultAsync();

                if (conversation == null)
                    return NotFound(new { message = "Conversation not found" });

                var lastMessage = await _context.ChatMessages
                    .Where(m => m.ConversationId == id)
                    .OrderByDescending(m => m.CreatedAt)
                    .FirstOrDefaultAsync();

                var unreadCount = await _context.ChatMessages
                    .CountAsync(m => m.ConversationId == id && !m.IsRead && m.SenderId != userId);

                return Ok(new ConversationResponseDto
                {
                    Id = conversation.Id,
                    PropertyId = conversation.PropertyId,
                    PropertyTitle = conversation.Property?.Title ?? "Unknown Property",
                    PropertyImage = conversation.Property?.Images.FirstOrDefault(),
                    PropertyPrice = conversation.Property?.Price ?? 0,
                    UserId = conversation.UserId,
                    UserName = conversation.User?.Username ?? "Unknown User",
                    UserProfilePicture = conversation.User?.ProfilePictureUrl,
                    AgentId = conversation.AgentId,
                    AgentName = conversation.Agent?.Username ?? "Unknown Agent",
                    AgentProfilePicture = conversation.Agent?.ProfilePictureUrl,
                    LastMessage = lastMessage?.Content,
                    LastMessageAt = lastMessage?.CreatedAt,
                    UnreadCount = unreadCount,
                    CreatedAt = conversation.CreatedAt,
                    UpdatedAt = conversation.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching conversation: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching conversation", error = ex.Message });
            }
        }

        // PUT: api/chat/conversations/{id}/archive
        [HttpPut("conversations/{id}/archive")]
        public async Task<IActionResult> ArchiveConversation(int id)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var conversation = await _context.ChatConversations
                    .FirstOrDefaultAsync(c => c.Id == id && (c.UserId == userId || c.AgentId == userId));

                if (conversation == null)
                    return NotFound(new { message = "Conversation not found" });

                // Archive for the current user
                if (conversation.UserId == userId)
                    conversation.IsArchivedByUser = true;
                else if (conversation.AgentId == userId)
                    conversation.IsArchivedByAgent = true;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Conversation archived successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error archiving conversation: {ex.Message}");
                return StatusCode(500, new { message = "Error archiving conversation", error = ex.Message });
            }
        }

        // PUT: api/chat/conversations/{id}/unarchive
        [HttpPut("conversations/{id}/unarchive")]
        public async Task<IActionResult> UnarchiveConversation(int id)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var conversation = await _context.ChatConversations
                    .FirstOrDefaultAsync(c => c.Id == id && (c.UserId == userId || c.AgentId == userId));

                if (conversation == null)
                    return NotFound(new { message = "Conversation not found" });

                // Unarchive for the current user
                if (conversation.UserId == userId)
                    conversation.IsArchivedByUser = false;
                else if (conversation.AgentId == userId)
                    conversation.IsArchivedByAgent = false;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Conversation restored from archive" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error unarchiving conversation: {ex.Message}");
                return StatusCode(500, new { message = "Error unarchiving conversation", error = ex.Message });
            }
        }

        // GET: api/chat/admin/conversations - Admin only - Get ALL conversations
        [HttpGet("admin/conversations")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllConversationsAdmin()
        {
            try
            {
                var conversations = await _context.ChatConversations
                    .Include(c => c.Property)
                    .Include(c => c.User)
                    .Include(c => c.Agent)
                    .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                    .OrderByDescending(c => c.UpdatedAt)
                    .ToListAsync();

                var response = conversations.Select(c =>
                {
                    var lastMessage = c.Messages.FirstOrDefault();
                    var unreadCount = _context.ChatMessages.Count(m => m.ConversationId == c.Id && !m.IsRead);

                    return new ConversationResponseDto
                    {
                        Id = c.Id,
                        PropertyId = c.PropertyId,
                        PropertyTitle = c.Property?.Title ?? "Unknown Property",
                        PropertyImage = c.Property?.Images.FirstOrDefault(),
                        PropertyPrice = c.Property?.Price ?? 0,
                        UserId = c.UserId,
                        UserName = c.User?.Username ?? "Unknown User",
                        UserProfilePicture = c.User?.ProfilePictureUrl,
                        AgentId = c.AgentId,
                        AgentName = c.Agent?.Username ?? "Unknown Agent",
                        AgentProfilePicture = c.Agent?.ProfilePictureUrl,
                        LastMessage = lastMessage?.Content,
                        LastMessageAt = lastMessage?.CreatedAt,
                        UnreadCount = unreadCount,
                        CreatedAt = c.CreatedAt,
                        UpdatedAt = c.UpdatedAt
                    };
                });

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching all conversations: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching conversations", error = ex.Message });
            }
        }

        // GET: api/chat/admin/conversations/{id}/messages - Admin only - Get messages for any conversation
        [HttpGet("admin/conversations/{id}/messages")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetMessagesAdmin(int id)
        {
            try
            {
                var conversation = await _context.ChatConversations.FindAsync(id);
                if (conversation == null)
                    return NotFound(new { message = "Conversation not found" });

                var messages = await _context.ChatMessages
                    .Where(m => m.ConversationId == id)
                    .Include(m => m.Sender)
                    .OrderBy(m => m.CreatedAt)
                    .ToListAsync();

                var response = messages.Select(m => new MessageResponseDto
                {
                    Id = m.Id,
                    ConversationId = m.ConversationId,
                    SenderId = m.SenderId,
                    SenderName = m.Sender?.Username ?? "Unknown",
                    SenderProfilePicture = m.Sender?.ProfilePictureUrl,
                    Content = m.Content,
                    IsRead = m.IsRead,
                    CreatedAt = m.CreatedAt
                });

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching messages for admin: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching messages", error = ex.Message });
            }
        }

        // DELETE: api/chat/conversations/{id}
        // Permanently delete a conversation for the current user
        [HttpDelete("conversations/{id}")]
        public async Task<IActionResult> DeleteConversation(int id)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var conversation = await _context.ChatConversations
                    .Include(c => c.Messages)
                    .FirstOrDefaultAsync(c => c.Id == id && (c.UserId == userId || c.AgentId == userId));

                if (conversation == null)
                    return NotFound(new { message = "Conversation not found" });

                // Mark as deleted for the current user
                if (conversation.UserId == userId)
                {
                    conversation.IsDeletedByUser = true;
                    conversation.IsArchivedByUser = false;
                }
                else if (conversation.AgentId == userId)
                {
                    conversation.IsDeletedByAgent = true;
                    conversation.IsArchivedByAgent = false;
                }

                // If both parties have deleted, remove the conversation entirely
                if (conversation.IsDeletedByUser && conversation.IsDeletedByAgent)
                {
                    _context.ChatMessages.RemoveRange(conversation.Messages);
                    _context.ChatConversations.Remove(conversation);
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Conversation deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting conversation: {ex.Message}");
                return StatusCode(500, new { message = "Error deleting conversation", error = ex.Message });
            }
        }
    }
}
