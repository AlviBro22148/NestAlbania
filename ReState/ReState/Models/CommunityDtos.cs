// Add/Update these in your Models.cs file

using System.ComponentModel.DataAnnotations;

namespace ReState.Models
{
    // Community Post DTOs
    public class CreatePostDto
    {
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(2000)]
        public string Content { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Category { get; set; } = string.Empty; // Tips, Questions, Experiences
    }

    public class PostResponseDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? UserProfilePicture { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int Likes { get; set; }
        public int CommentCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // Comment DTOs
    public class CreateCommentDto
    {
        [Required]
        public int PostId { get; set; }

        [Required]
        [StringLength(500)]
        public string Comment { get; set; } = string.Empty;
    }

    public class CommentResponseDto
    {
        public int Id { get; set; }
        public Guid UserId { get; set; } // Added for deletion permission check
        public string Username { get; set; } = string.Empty;
        public string? UserProfilePicture { get; set; }
        public string Comment { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    // Review DTOs
    public class CreateReviewDto
    {
        [Required]
        public int PropertyId { get; set; }

        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [Required]
        [StringLength(1000)]
        public string Comment { get; set; } = string.Empty;
    }

    public class ReviewResponseDto
    {
        public int Id { get; set; }
        public int PropertyId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? UserProfilePicture { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsVerified { get; set; }
    }

    // Feedback DTOs
    public class CreateFeedbackDto
    {
        [Required]
        [StringLength(50)]
        public string FeedbackType { get; set; } = string.Empty; // Bug, Feature Request, General

        [Required]
        [StringLength(200)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        [StringLength(2000)]
        public string Message { get; set; } = string.Empty;
    }

    public class FeedbackResponseDto
    {
        public int Id { get; set; }
        public string FeedbackType { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}