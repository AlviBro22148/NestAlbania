using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReState.Entities
{
    public class UserFeedback
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public Guid UserId { get; set; }
        public User? User { get; set; }

        [Required]
        [MaxLength(50)]
        public string FeedbackType { get; set; } = string.Empty; // Bug, Feature Request, General

        [Required]
        [MaxLength(200)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        [MaxLength(2000)]
        public string Message { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending"; // Pending, Reviewed, Resolved

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}