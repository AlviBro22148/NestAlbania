using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReState.Entities
{
    public class UserPreference
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        // Property Types - stored as comma-separated values (e.g., "Houses,Apartments,Villas")
        [StringLength(500)]
        public string? PreferredPropertyTypes { get; set; }

        // Bedroom preferences
        public int? MinBedrooms { get; set; }
        public int? MaxBedrooms { get; set; }

        // Bathroom preferences
        public int? MinBathrooms { get; set; }
        public int? MaxBathrooms { get; set; }

        // Price range
        [Column(TypeName = "decimal(18,2)")]
        public decimal? MinPrice { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal? MaxPrice { get; set; }

        // Area preferences (in square meters)
        [Column(TypeName = "decimal(18,2)")]
        public decimal? MinArea { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal? MaxArea { get; set; }

        // City preferences - stored as comma-separated values
        [StringLength(500)]
        public string? PreferredCities { get; set; }

        // Listing type preference (Sale, Rent, or Both)
        [StringLength(20)]
        public string? ListingType { get; set; }

        // Amenity preferences
        public bool? WantsGarage { get; set; }
        public bool? WantsPetFriendly { get; set; }
        public bool? WantsPool { get; set; }
        public bool? WantsGym { get; set; }
        public bool? WantsAirConditioning { get; set; }

        // Green/Eco preferences
        public bool? PrefersGreenHomes { get; set; }
        public int? MinEcoScore { get; set; }

        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Helper property to get property types as list (not mapped to DB)
        [NotMapped]
        public List<string> PropertyTypesList
        {
            get => string.IsNullOrEmpty(PreferredPropertyTypes)
                ? new List<string>()
                : PreferredPropertyTypes.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();
            set => PreferredPropertyTypes = value.Any() ? string.Join(",", value) : null;
        }

        // Helper property to get cities as list (not mapped to DB)
        [NotMapped]
        public List<string> CitiesList
        {
            get => string.IsNullOrEmpty(PreferredCities)
                ? new List<string>()
                : PreferredCities.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();
            set => PreferredCities = value.Any() ? string.Join(",", value) : null;
        }
    }
}
