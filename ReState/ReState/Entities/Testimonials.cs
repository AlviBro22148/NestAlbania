using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ReState.Entities;

namespace ReState.Models
{
    public class Testimonial
    {
        [Key]
        public int Id { get; set; }

        // User who submitted the testimonial
        [Required]
        public Guid UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        // Optional: Property they're reviewing (if related to specific property)
        public int? PropertyId { get; set; }

        [ForeignKey("PropertyId")]
        public Property? Property { get; set; }

        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Comment { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? ServiceType { get; set; } // e.g., "Buying", "Selling", "Renting"

        public bool IsVerified { get; set; } = false; // Admin verification

        public int HelpfulCount { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}