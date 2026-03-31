using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReState.Entities
{
    public class PushToken
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        [MaxLength(500)]
        public string Token { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Platform { get; set; } = string.Empty; // "ios", "android"

        [MaxLength(200)]
        public string? DeviceName { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? LastUsedAt { get; set; }

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}
