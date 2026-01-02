using System.Text.Json.Serialization;

namespace ReState.Models
{
    public class BlogArticleDto
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new List<string>();
        public int ReadTimeMinutes { get; set; } = 5;
        public bool IsFeatured { get; set; } = false;
        public bool IsPublished { get; set; } = true;
    }

    public class BlogArticleResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new List<string>();
        public int ViewCount { get; set; }
        public int ReadTimeMinutes { get; set; }
        public bool IsFeatured { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class BlogFilterDto
    {
        public string? Category { get; set; }
        public string? SearchTerm { get; set; }
        public string? Tag { get; set; }
        public bool? IsFeatured { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }



    public class BlogArticleCreateDto
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public IFormFile Image { get; set; } = null!;
        public string Tags { get; set; } = string.Empty; // Comma-separated
        public int ReadTimeMinutes { get; set; } = 5;
        public bool IsFeatured { get; set; } = false;
        public bool IsPublished { get; set; } = true;
    }

    public class BlogArticleUpdateDto
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public IFormFile? Image { get; set; } // Optional on update
        public string Tags { get; set; } = string.Empty;
        public int ReadTimeMinutes { get; set; } = 5;
        public bool IsFeatured { get; set; } = false;
        public bool IsPublished { get; set; } = true;
    }

    // DTO for admin dashboard - accepts image URL instead of file
    public class BlogArticleCreateWithUrlDto
    {
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;

        [JsonPropertyName("summary")]
        public string Summary { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = string.Empty;

        [JsonPropertyName("imageUrl")]
        public string ImageUrl { get; set; } = string.Empty;

        [JsonPropertyName("tags")]
        public List<string> Tags { get; set; } = new List<string>();

        [JsonPropertyName("readTimeMinutes")]
        public int ReadTimeMinutes { get; set; } = 5;

        [JsonPropertyName("isFeatured")]
        public bool IsFeatured { get; set; } = false;

        [JsonPropertyName("isPublished")]
        public bool IsPublished { get; set; } = true;
    }

    public class BlogArticleUpdateWithUrlDto
    {
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;

        [JsonPropertyName("summary")]
        public string Summary { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = string.Empty;

        [JsonPropertyName("imageUrl")]
        public string? ImageUrl { get; set; }

        [JsonPropertyName("tags")]
        public List<string> Tags { get; set; } = new List<string>();

        [JsonPropertyName("readTimeMinutes")]
        public int ReadTimeMinutes { get; set; } = 5;

        [JsonPropertyName("isFeatured")]
        public bool IsFeatured { get; set; } = false;

        [JsonPropertyName("isPublished")]
        public bool IsPublished { get; set; } = true;
    }

}
