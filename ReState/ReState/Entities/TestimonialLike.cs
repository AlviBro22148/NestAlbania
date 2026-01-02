using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ReState.Entities;

namespace ReState.Models
{
    public class TestimonialLike
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TestimonialId { get; set; }

        [ForeignKey("TestimonialId")]
        public Testimonial? Testimonial { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
