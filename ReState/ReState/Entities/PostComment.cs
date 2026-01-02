using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReState.Entities
{
    public class PostComment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PostId { get; set; }
        public CommunityPost? Post { get; set; }

        [Required]
        public Guid UserId { get; set; }
        public User? User { get; set; }

        [Required]
        [MaxLength(500)]
        public string Comment { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}