using System.ComponentModel.DataAnnotations;

namespace ReState.Entities
{
    public class ChatConversation
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PropertyId { get; set; }

        [Required]
        public Guid UserId { get; set; }  // The user who initiated the conversation

        [Required]
        public Guid AgentId { get; set; }  // The property owner/agent

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Archive/Delete status for each party (each user manages their own view)
        public bool IsArchivedByUser { get; set; } = false;
        public bool IsArchivedByAgent { get; set; } = false;
        public bool IsDeletedByUser { get; set; } = false;
        public bool IsDeletedByAgent { get; set; } = false;

        // Navigation properties
        public Property? Property { get; set; }
        public User? User { get; set; }
        public User? Agent { get; set; }
        public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }

    public class ChatMessage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ConversationId { get; set; }

        [Required]
        public Guid SenderId { get; set; }

        [Required]
        public string Content { get; set; } = string.Empty;

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ChatConversation? Conversation { get; set; }
        public User? Sender { get; set; }
    }
}
