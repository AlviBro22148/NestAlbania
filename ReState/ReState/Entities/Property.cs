using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReState.Entities
{
    public class Property
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(2000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string Address { get; set; } = string.Empty;

        [Required]
        [Range(0.01, 999999999.99)]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        [StringLength(5000)]
        public string ImageUrls { get; set; } = string.Empty;

        [Required]
        public Guid UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        // Basic Property Fields
        public int Bedrooms { get; set; }
        public int Bathrooms { get; set; }
        public decimal Area { get; set; }

        [StringLength(50)]
        public string PropertyType { get; set; } = "Apartment";

        [StringLength(50)]
        public string Status { get; set; } = "Available";

        // Location Details
        [StringLength(100)]
        public string City { get; set; } = string.Empty;

        [StringLength(100)]
        public string Neighborhood { get; set; } = string.Empty;

        [StringLength(20)]
        public string ZipCode { get; set; } = string.Empty;

        // Size and Area
        [Column(TypeName = "decimal(18,2)")]
        public decimal? LotSize { get; set; }

        // Timing
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Key Features
        public int ParkingSpaces { get; set; } = 0;
        public bool HasGarage { get; set; } = false;

        // Amenities
        public bool IsPetFriendly { get; set; } = false;
        public bool HasInUnitLaundry { get; set; } = false;
        public bool HasPool { get; set; } = false;
        public bool HasGym { get; set; } = false;
        public bool HasAirConditioning { get; set; } = false;

        // Green Features (7 features)
        public bool HasSolarPanels { get; set; } = false;
        public bool HasEnergyEfficientAppliances { get; set; } = false;
        public bool HasLEDLighting { get; set; } = false;
        public bool HasSmartThermostats { get; set; } = false;
        public bool HasDoubleGlazedWindows { get; set; } = false;
        public bool HasRainwaterHarvesting { get; set; } = false;
        public bool HasGreenRoof { get; set; } = false;

        // Certifications
        public bool HasEnergyStarCertification { get; set; } = false;
        public bool HasLEEDCertification { get; set; } = false;

        [StringLength(20)]
        public string? LEEDLevel { get; set; } // "Certified", "Silver", "Gold", "Platinum"

        // Calculated Eco Score (0-100)
        [NotMapped]
        public int EcoScore => CalculateEcoScore();

        private int CalculateEcoScore()
        {
            int score = 0;

            // Certifications (40 points)
            if (HasLEEDCertification)
            {
                score += LEEDLevel switch
                {
                    "Platinum" => 25,
                    "Gold" => 20,
                    "Silver" => 15,
                    "Certified" => 10,
                    _ => 10
                };
            }
            if (HasEnergyStarCertification) score += 15;

            // Features (60 points)
            if (HasSolarPanels) score += 10;
            if (HasEnergyEfficientAppliances) score += 8;
            if (HasLEDLighting) score += 7;
            if (HasSmartThermostats) score += 8;
            if (HasDoubleGlazedWindows) score += 8;
            if (HasRainwaterHarvesting) score += 9;
            if (HasGreenRoof) score += 10;

            return Math.Min(score, 100);
        }

        // Year Built
        public int? YearBuilt { get; set; }

        // Listing Type
        [StringLength(20)]
        public string ListingType { get; set; } = "Sale";

        // Rental Options
        [Column(TypeName = "decimal(18,2)")]
        public decimal? MonthlyRent { get; set; }

        public int? LeaseTermMonths { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? SecurityDeposit { get; set; }

        public bool UtilitiesIncluded { get; set; } = false;

        [StringLength(50)]
        public string FurnishedStatus { get; set; } = "Unfurnished";

        // Images
        [NotMapped]
        public List<string> Images
        {
            get => string.IsNullOrEmpty(ImageUrls)
                ? new List<string>()
                : ImageUrls.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();
            set => ImageUrls = string.Join(",", value);
        }
    }
}