using System.ComponentModel.DataAnnotations;

namespace ReState.Models
{
  
    public class UpdateProfileDto
    {
        [Required]
        [StringLength(50, MinimumLength = 3)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Phone]
        [StringLength(20)]
        [RegularExpression(@"^\+[1-9]\d{1,14}$", ErrorMessage = "Phone number must include country code (e.g., +355)")]
        public string? PhoneNumber { get; set; }


    }

    
    public class ChangePasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string NewPassword { get; set; } = string.Empty;
    }

    // DTO for user profile response
    public class UserProfileDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? ProfilePictureUrl { get; set; }
        public string? GoogleId { get; set; }
        public int PropertiesCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}