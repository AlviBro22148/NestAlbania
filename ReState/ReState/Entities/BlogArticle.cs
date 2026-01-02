using System.ComponentModel.DataAnnotations;

namespace ReState.Entities
{
    public class BlogArticle
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Summary { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = string.Empty; // Market Trends, First-Time Buyers, Investment Tips, News

        public string ImageUrl { get; set; } = string.Empty;

        public List<string> Tags { get; set; } = new List<string>();

        [Required]
        public Guid AuthorId { get; set; }
        public User? Author { get; set; }

        public int ViewCount { get; set; } = 0;
        public int ReadTimeMinutes { get; set; } = 5;

        public bool IsFeatured { get; set; } = false;
        public bool IsPublished { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}