using System.ComponentModel.DataAnnotations;

namespace ReState.Models
{
    // DTO for creating/updating user preferences
    public class UserPreferenceDto
    {
        // Property types the user is interested in
        public List<string>? PreferredPropertyTypes { get; set; }

        // Bedroom preferences
        [Range(0, 20)]
        public int? MinBedrooms { get; set; }
        [Range(0, 20)]
        public int? MaxBedrooms { get; set; }

        // Bathroom preferences
        [Range(0, 20)]
        public int? MinBathrooms { get; set; }
        [Range(0, 20)]
        public int? MaxBathrooms { get; set; }

        // Price range
        [Range(0, double.MaxValue)]
        public decimal? MinPrice { get; set; }
        [Range(0, double.MaxValue)]
        public decimal? MaxPrice { get; set; }

        // Area preferences (in square meters)
        [Range(0, double.MaxValue)]
        public decimal? MinArea { get; set; }
        [Range(0, double.MaxValue)]
        public decimal? MaxArea { get; set; }

        // City preferences
        public List<string>? PreferredCities { get; set; }

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
        [Range(0, 100)]
        public int? MinEcoScore { get; set; }
    }

    // Response DTO for getting user preferences
    public class UserPreferenceResponseDto
    {
        public int Id { get; set; }
        public Guid UserId { get; set; }

        public List<string> PreferredPropertyTypes { get; set; } = new();

        public int? MinBedrooms { get; set; }
        public int? MaxBedrooms { get; set; }

        public int? MinBathrooms { get; set; }
        public int? MaxBathrooms { get; set; }

        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }

        public decimal? MinArea { get; set; }
        public decimal? MaxArea { get; set; }

        public List<string> PreferredCities { get; set; } = new();

        public string? ListingType { get; set; }

        public bool? WantsGarage { get; set; }
        public bool? WantsPetFriendly { get; set; }
        public bool? WantsPool { get; set; }
        public bool? WantsGym { get; set; }
        public bool? WantsAirConditioning { get; set; }

        public bool? PrefersGreenHomes { get; set; }
        public int? MinEcoScore { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public bool HasPreferences { get; set; }
    }
}
