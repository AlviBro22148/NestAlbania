namespace ReState.Models
{
    public class StartConversationDto
    {
        public int PropertyId { get; set; }
        public string InitialMessage { get; set; } = string.Empty;
    }

    public class SendMessageDto
    {
        public string Content { get; set; } = string.Empty;
    }

    public class ConversationResponseDto
    {
        public int Id { get; set; }
        public int PropertyId { get; set; }
        public string PropertyTitle { get; set; } = string.Empty;
        public string? PropertyImage { get; set; }
        public decimal PropertyPrice { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? UserProfilePicture { get; set; }
        public Guid AgentId { get; set; }
        public string AgentName { get; set; } = string.Empty;
        public string? AgentProfilePicture { get; set; }
        public string? LastMessage { get; set; }
        public DateTime? LastMessageAt { get; set; }
        public int UnreadCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class MessageResponseDto
    {
        public int Id { get; set; }
        public int ConversationId { get; set; }
        public Guid SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string? SenderProfilePicture { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class UnreadCountResponseDto
    {
        public int TotalUnread { get; set; }
    }
}
