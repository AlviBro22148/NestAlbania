using System.ComponentModel.DataAnnotations;

namespace ReState.Entities
{
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        public int? PropertyId { get; set; }

        [Required]
        [StringLength(50)]
        public string Type { get; set; } = string.Empty; // PriceChange, StatusChange, NewProperty

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string Message { get; set; } = string.Empty;

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User? User { get; set; }
        public Property? Property { get; set; }
    }

    public class NotificationPreference
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        public bool PriceChangeAlerts { get; set; } = true;
        public bool StatusChangeAlerts { get; set; } = true;
        public bool NewPropertyAlerts { get; set; } = false;
        public decimal? MaxPrice { get; set; }
        public int? MinBedrooms { get; set; }
        public string? PreferredCity { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation property
        public User? User { get; set; }
    }

    public class PropertyPriceHistory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PropertyId { get; set; }

        [Required]
        public decimal OldPrice { get; set; }

        [Required]
        public decimal NewPrice { get; set; }

        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public Property? Property { get; set; }
    }
}