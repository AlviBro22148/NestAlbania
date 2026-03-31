using System.ComponentModel.DataAnnotations;

namespace ReState.Models
{
    // DTO for creating/updating properties (PropertyDto)
    // This holds all necessary input fields, including rent-specific data.
    public class PropertyDto
    {
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(2000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string Address { get; set; } = string.Empty;

        // Price is for Sale listings; will be null/zero for Rent unless also for sale
        [Required]
        [Range(0.01, 999999999.99)]
        public decimal Price { get; set; }

        [Required]
        [Range(0, 20)]
        public int Bedrooms { get; set; }

        [Required]
        [Range(0, 20)]
        public int Bathrooms { get; set; }

        [Required]
        [Range(0.01, 999999999.99)]
        public decimal Area { get; set; }

        [Required]
        [StringLength(50)]
        public string PropertyType { get; set; } = "Apartment";

        // Location Details
        [StringLength(100)]
        public string City { get; set; } = string.Empty;

        [StringLength(100)]
        public string Neighborhood { get; set; } = string.Empty;

        [StringLength(20)]
        public string ZipCode { get; set; } = string.Empty;

        // Size
        public decimal? LotSize { get; set; }

        // Features
        public int ParkingSpaces { get; set; } = 0;
        public bool HasGarage { get; set; } = false;

        // Amenities
        public bool IsPetFriendly { get; set; } = false;
        public bool HasInUnitLaundry { get; set; } = false;
        public bool HasPool { get; set; } = false;
        public bool HasGym { get; set; } = false;
        public bool HasAirConditioning { get; set; } = false;

        // Green Features
        public bool HasSolarPanels { get; set; } = false;
        public bool HasEnergyEfficientAppliances { get; set; } = false;
        public bool HasLEDLighting { get; set; } = false;
        public bool HasSmartThermostats { get; set; } = false;
        public bool HasDoubleGlazedWindows { get; set; } = false;
        public bool HasRainwaterHarvesting { get; set; } = false;
        public bool HasGreenRoof { get; set; } = false;
        public bool HasEnergyStarCertification { get; set; } = false;
        public bool HasLEEDCertification { get; set; } = false;
        public string? LEEDLevel { get; set; }

        // Year
        public int? YearBuilt { get; set; }


        [StringLength(20)]
        public string ListingType { get; set; } = "Sale";

        // Renting Options (Keep these as they are data points to be saved/updated)
        public decimal? MonthlyRent { get; set; }
        public int? LeaseTermMonths { get; set; }
        public decimal? SecurityDeposit { get; set; }
        public bool UtilitiesIncluded { get; set; } = false;
        public string FurnishedStatus { get; set; } = "Unfurnished";
    }

    // DTO for creating properties with image URLs (for admin dashboard)
    public class PropertyCreateWithUrlsDto : PropertyDto
    {
        public List<string> Images { get; set; } = new();
        public Guid? UserId { get; set; } // Optional: assign to specific user (admin only)
    }

    // DTO for returning property data (PropertyResponseDto)
    // This includes all saved fields, including owner contact info and rent options.
    public class PropertyResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Bedrooms { get; set; }
        public int Bathrooms { get; set; }
        public decimal Area { get; set; }
        public string PropertyType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public List<string> Images { get; set; } = new();
        public Guid UserId { get; set; }
        public string? OwnerName { get; set; }
        public string? OwnerPhone { get; set; }
        public string? OwnerEmail { get; set; }
        public DateTime CreatedAt { get; set; }

        // Additional Fields
        public string City { get; set; } = string.Empty;
        public string Neighborhood { get; set; } = string.Empty;
        public string ZipCode { get; set; } = string.Empty;
        public decimal? LotSize { get; set; }   
        public int ParkingSpaces { get; set; }
        public bool HasGarage { get; set; }
        public bool IsPetFriendly { get; set; }
        public bool HasInUnitLaundry { get; set; }
        public bool HasPool { get; set; }
        public bool HasGym { get; set; }
        public bool HasAirConditioning { get; set; }
        public int? YearBuilt { get; set; }
        public string ListingType { get; set; } = string.Empty;

        // Renting Options (Added for response DTO)
        public decimal? MonthlyRent { get; set; }
        public int? LeaseTermMonths { get; set; }
        public decimal? SecurityDeposit { get; set; }
        public bool UtilitiesIncluded { get; set; }
        public string FurnishedStatus { get; set; } = string.Empty;

        // Green Features
        public bool HasSolarPanels { get; set; }
        public bool HasEnergyEfficientAppliances { get; set; }
        public bool HasLEDLighting { get; set; }
        public bool HasSmartThermostats { get; set; }
        public bool HasDoubleGlazedWindows { get; set; }
        public bool HasRainwaterHarvesting { get; set; }
        public bool HasGreenRoof { get; set; }
        public bool HasEnergyStarCertification { get; set; }
        public bool HasLEEDCertification { get; set; }
        public string? LEEDLevel { get; set; }
        public int EcoScore { get; set; }
    }

    // Lightweight DTO for list views to reduce JSON payload and parsing overhead
    public class PropertySummaryResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Bedrooms { get; set; }
        public int Bathrooms { get; set; }
        public decimal Area { get; set; }
        public string PropertyType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public List<string> Images { get; set; } = new();
        public string? OwnerName { get; set; }
        public string ListingType { get; set; } = string.Empty;
        public decimal? MonthlyRent { get; set; }
        public string City { get; set; } = string.Empty;
        public int EcoScore { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // DTO for filtering properties (PropertyFilterDto)
    // Cleaned up for correct range filtering and nullable defaults.
    public class PropertyFilterDto
    {
        // Location
        public string? City { get; set; }
        public string? Neighborhood { get; set; }
        public string? ZipCode { get; set; }

        // Price Range (for Sale)
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }

        // Property Type
        public List<string>? PropertyTypes { get; set; }

        // Bedrooms/Bathrooms
        public int? MinBedrooms { get; set; }
        public int? MinBathrooms { get; set; }

        // Size
        public decimal? MinArea { get; set; }
        public decimal? MaxArea { get; set; }
        public decimal? MinLotSize { get; set; }
        public decimal? MaxLotSize { get; set; }

        // Listing Status
        public string? ListingType { get; set; } // Sale, Rent
        public List<string>? Status { get; set; } // Available, Pending, Sold

        // New Listings
        public int? NewListingsDays { get; set; }

        // Features
        public int? MinParkingSpaces { get; set; }
        public bool? HasGarage { get; set; }

        // Amenities
        public bool? IsPetFriendly { get; set; }
        public bool? HasInUnitLaundry { get; set; }
        public bool? HasPool { get; set; }
        public bool? HasGym { get; set; }
        public bool? HasAirConditioning { get; set; }

        // Green/Eco Filters
        public bool? HasSolarPanels { get; set; }
        public bool? HasEnergyEfficientAppliances { get; set; }
        public bool? HasLEDLighting { get; set; }
        public bool? HasSmartThermostats { get; set; }
        public bool? HasDoubleGlazedWindows { get; set; }
        public bool? HasRainwaterHarvesting { get; set; }
        public bool? HasGreenRoof { get; set; }
        public bool? HasEnergyStarCertification { get; set; }
        public bool? HasLEEDCertification { get; set; }
        public int? MinEcoScore { get; set; }

        // Year Built
        public int? MinYearBuilt { get; set; }
        public int? MaxYearBuilt { get; set; }

        // Pagination
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;

        // Rent-specific Filters (Range-based, Cleaned up)

        // Monthly Rent Range
        public decimal? MinMonthlyRent { get; set; }
        public decimal? MaxMonthlyRent { get; set; }

        // Lease Term Range (Changed to Min/Max for better filtering)
        public int? MinLeaseTermMonths { get; set; }
        public int? MaxLeaseTermMonths { get; set; }

        // Security Deposit Range
        public decimal? MinSecurityDeposit { get; set; }
        public decimal? MaxSecurityDeposit { get; set; }

        // Boolean/String Filters (Changed to nullable to prevent unintended defaults)
        public bool? UtilitiesIncluded { get; set; }
        public string? FurnishedStatus { get; set; }
    }

    // DTO for updating property status
    public class UpdateStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }
}