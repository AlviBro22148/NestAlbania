using ReState.Entities;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace YourNamespace.Models // Replace with your actual namespace
{
    public class AgentRequest
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Username { get; set; }

        [Required]
        [MaxLength(255)]
        public string Email { get; set; }

        [MaxLength(50)]
        public string PhoneNumber { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } // "Pending", "Approved", "Rejected"

        [Required]
        public DateTime RequestedAt { get; set; }

        public DateTime? ReviewedAt { get; set; }

        public Guid? ReviewedBy { get; set; }

        [MaxLength(500)]
        public string? RejectionReason { get; set; }

        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; }

        [ForeignKey("ReviewedBy")]
        public virtual User Reviewer { get; set; }
    }
}