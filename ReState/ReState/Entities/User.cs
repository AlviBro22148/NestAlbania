
using System.ComponentModel.DataAnnotations;

namespace ReState.Entities
{
    public class User
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [StringLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; } = string.Empty;

      
        [Required]
        [Phone]
        [StringLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Role { get; set; } = "User";

        // City field for CityAdmin filtering
        [StringLength(50)]
        public string? City { get; set; }

        // Google OAuth properties
        public string? GoogleId { get; set; }
        public string? ProfilePictureUrl { get; set; }

        // Refresh token properties
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }

        // Navigation properties
        public ICollection<Property>? Properties { get; set; }
        public UserPreference? Preference { get; set; }

        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        //2FA
        public bool TwoFactorEnabled { get; set; } = false;
        public string? TwoFactorCode { get; set; }
        public DateTime? TwoFactorCodeExpiry { get; set; }

        // Ban properties
        public bool IsBanned { get; set; } = false;
        public string? BanReason { get; set; }
        public DateTime? BannedAt { get; set; }
        public Guid? BannedBy { get; set; }
    }
}