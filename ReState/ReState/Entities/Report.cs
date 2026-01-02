using System.ComponentModel.DataAnnotations;

namespace ReState.Entities
{
    public class Report
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User? User { get; set; }
        public ICollection<ReportProperty> ReportProperties { get; set; } = new List<ReportProperty>();
    }

    public class ReportProperty
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ReportId { get; set; }

        [Required]
        public int PropertyId { get; set; }

        [StringLength(1000)]
        public string? Notes { get; set; }

        public DateTime AddedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Report? Report { get; set; }
        public Property? Property { get; set; }
    }
}
