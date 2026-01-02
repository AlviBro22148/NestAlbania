using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReState.Entities
{
    public class PostLike
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PostId { get; set; }
        public CommunityPost? Post { get; set; }

        [Required]
        public Guid UserId { get; set; }
        public User? User { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}