using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReState.Data;
using ReState.Entities;
using ReState.Models;
using ReState.Services;
using System.Security.Claims;

namespace ReState.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PropertiesController : ControllerBase
    {
        private readonly IPropertyService _propertyService;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public PropertiesController(
            IPropertyService propertyService,
            ICloudinaryService cloudinaryService,
            ApplicationDbContext context,
            INotificationService notificationService)
        {
            _propertyService = propertyService;
            _cloudinaryService = cloudinaryService;
            _context = context;
            _notificationService = notificationService;
        }

        // GET: api/properties/home - Combined endpoint for home screen (reduces API calls from 4 to 1)
        [HttpGet("home")]
        [AllowAnonymous]
        public async Task<IActionResult> GetHomeData()
        {
            try
            {
                // Run queries sequentially to identify which one fails
                List<PropertySummaryResponseDto> featured;
                List<PropertySummaryResponseDto> todaysChoice;
                List<PropertySummaryResponseDto> greenHomes;
                YourChoiceResult? yourChoiceResult = null;

                try
                {
                    featured = await GetFeaturedPropertiesData();
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { message = "Error in GetFeaturedPropertiesData", error = ex.Message, stack = ex.StackTrace });
                }

                try
                {
                    todaysChoice = await GetTodaysChoiceData();
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { message = "Error in GetTodaysChoiceData", error = ex.Message, stack = ex.StackTrace });
                }

                try
                {
                    greenHomes = await GetGreenHomesData();
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { message = "Error in GetGreenHomesData", error = ex.Message, stack = ex.StackTrace });
                }

                // Check if user is authenticated for personalized content
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userIdString) && Guid.TryParse(userIdString, out Guid userId))
                {
                    try
                    {
                        yourChoiceResult = await GetYourChoiceData(userId, 1, 10);
                    }
                    catch (Exception ex)
                    {
                        return StatusCode(500, new { message = "Error in GetYourChoiceData", error = ex.Message, stack = ex.StackTrace });
                    }
                }

                return Ok(new
                {
                    featured = featured,
                    todaysChoice = todaysChoice,
                    greenHomes = greenHomes,
                    yourChoice = yourChoiceResult?.Properties ?? new List<PropertySummaryResponseDto>(),
                    yourChoicePagination = yourChoiceResult?.Pagination
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving home data", error = ex.Message, stack = ex.StackTrace });
            }
        }

        // Helper method for featured properties
        // PERFORMANCE FIX: Single query + in-memory shuffle instead of N queries in a loop
        private async Task<List<PropertySummaryResponseDto>> GetFeaturedPropertiesData()
        {
            // Fetch a limited pool of recent properties, then shuffle in memory
            // This is much faster than the original N queries in a loop
            var candidatePool = await _context.Properties
                .Include(p => p.User)
                .Where(p => p.Status == "Available")
                .OrderByDescending(p => p.CreatedAt)
                .Take(20) // Get 20 candidates, pick 5 randomly
                .AsNoTracking()
                .ToListAsync();

            if (candidatePool.Count == 0)
                return new List<PropertySummaryResponseDto>();

            // Shuffle in memory and take 5
            var random = new Random();
            var properties = candidatePool
                .OrderBy(x => random.Next())
                .Take(5)
                .ToList();

            return properties.Select(MapToSummaryDto).ToList();
        }

        // Helper method for today's choice
        // PERFORMANCE FIX: Fetch only recent/quality properties instead of ALL, then score in memory
        private async Task<List<PropertySummaryResponseDto>> GetTodaysChoiceData()
        {
            var today = DateTime.UtcNow.Date;
            var seed = today.Year * 10000 + today.Month * 100 + today.Day;
            var random = new Random(seed);

            // Fetch only the most recent 50 properties with good criteria (has images, recent)
            // This limits memory usage while still providing variety for scoring
            // Note: ImageUrls is the actual DB column, Images is a computed property
            var candidateProperties = await _context.Properties
                .Include(p => p.User)
                .Where(p => p.Status == "Available")
                .Where(p => !string.IsNullOrEmpty(p.ImageUrls)) // Only properties with images
                .OrderByDescending(p => p.CreatedAt) // Prefer newer properties
                .Take(50) // Limit candidates for in-memory scoring
                .AsNoTracking()
                .ToListAsync();

            if (candidateProperties.Count == 0)
                return new List<PropertySummaryResponseDto>();

            // Score only the limited candidate set in memory
            return candidateProperties
                .Select(p => new { Property = p, Score = CalculatePropertyScore(p, today) })
                .OrderByDescending(x => x.Score)
                .ThenBy(x => random.Next())
                .Take(5)
                .Select(x => MapToSummaryDto(x.Property))
                .ToList();
        }

        // Helper method for green homes
        private async Task<List<PropertySummaryResponseDto>> GetGreenHomesData()
        {
            var properties = await _context.Properties
                .Include(p => p.User)
                .Where(p => p.Status == "Available" &&
                           (p.HasLEEDCertification ||
                            p.HasEnergyStarCertification ||
                            p.HasSolarPanels ||
                            p.HasEnergyEfficientAppliances ||
                            p.HasLEDLighting ||
                            p.HasSmartThermostats ||
                            p.HasDoubleGlazedWindows ||
                            p.HasRainwaterHarvesting ||
                            p.HasGreenRoof))
                .ToListAsync();

            if (properties.Count == 0)
                return new List<PropertySummaryResponseDto>();

            return properties
                .OrderByDescending(p => p.EcoScore)
                .Take(10)
                .Select(MapToSummaryDto)
                .ToList();
        }

        // Helper class for your-choice result
        private class YourChoiceResult
        {
            public List<PropertySummaryResponseDto> Properties { get; set; } = new();
            public object? Pagination { get; set; }
        }

        // Helper method for your-choice (personalized)
        private async Task<YourChoiceResult> GetYourChoiceData(Guid userId, int page, int pageSize)
        {
            var preferences = await _context.UserPreferences
                .FirstOrDefaultAsync(p => p.UserId == userId);

            var query = _context.Properties
                .Include(p => p.User)
                .Where(p => p.Status == "Available")
                .AsQueryable();

            if (preferences != null)
            {
                var propertyTypes = preferences.PropertyTypesList;
                if (propertyTypes.Any())
                    query = query.Where(p => propertyTypes.Contains(p.PropertyType));

                if (preferences.MinBedrooms.HasValue)
                    query = query.Where(p => p.Bedrooms >= preferences.MinBedrooms.Value);
                if (preferences.MaxBedrooms.HasValue)
                    query = query.Where(p => p.Bedrooms <= preferences.MaxBedrooms.Value);

                if (preferences.MinBathrooms.HasValue)
                    query = query.Where(p => p.Bathrooms >= preferences.MinBathrooms.Value);
                if (preferences.MaxBathrooms.HasValue)
                    query = query.Where(p => p.Bathrooms <= preferences.MaxBathrooms.Value);

                if (preferences.MinPrice.HasValue)
                    query = query.Where(p => p.Price >= preferences.MinPrice.Value);
                if (preferences.MaxPrice.HasValue)
                    query = query.Where(p => p.Price <= preferences.MaxPrice.Value);

                if (preferences.MinArea.HasValue)
                    query = query.Where(p => p.Area >= preferences.MinArea.Value);
                if (preferences.MaxArea.HasValue)
                    query = query.Where(p => p.Area <= preferences.MaxArea.Value);

                var cities = preferences.CitiesList;
                if (cities.Any())
                    query = query.Where(p => cities.Contains(p.City));

                if (!string.IsNullOrEmpty(preferences.ListingType) && preferences.ListingType != "Both")
                    query = query.Where(p => p.ListingType == preferences.ListingType);

                if (preferences.WantsGarage == true)
                    query = query.Where(p => p.HasGarage);
                if (preferences.WantsPetFriendly == true)
                    query = query.Where(p => p.IsPetFriendly);
                if (preferences.WantsPool == true)
                    query = query.Where(p => p.HasPool);
                if (preferences.WantsGym == true)
                    query = query.Where(p => p.HasGym);
                if (preferences.WantsAirConditioning == true)
                    query = query.Where(p => p.HasAirConditioning);

                if (preferences.PrefersGreenHomes == true)
                    query = query.Where(p =>
                        p.HasLEEDCertification ||
                        p.HasEnergyStarCertification ||
                        p.HasSolarPanels ||
                        p.HasEnergyEfficientAppliances);
            }

            var totalCount = await query.CountAsync();
            pageSize = Math.Min(Math.Max(pageSize, 1), 50);
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var properties = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new YourChoiceResult
            {
                Properties = properties.Select(MapToSummaryDto).ToList(),
                Pagination = new
                {
                    currentPage = page,
                    totalPages = totalPages,
                    totalCount = totalCount,
                    pageSize = pageSize
                }
            };
        }

        // Reusable DTO mapper (Full Detail)
        private PropertyResponseDto MapToDto(Property p) => new PropertyResponseDto
        {
            Id = p.Id,
            Title = p.Title,
            Description = p.Description,
            Address = p.Address,
            Price = p.Price,
            Bedrooms = p.Bedrooms,
            Bathrooms = p.Bathrooms,
            Area = p.Area,
            PropertyType = p.PropertyType,
            Status = p.Status,
            Images = p.Images,
            UserId = p.UserId,
            OwnerName = p.User?.Username,
            CreatedAt = p.CreatedAt,
            OwnerPhone = p.User?.PhoneNumber,
            OwnerEmail = p.User?.Email,
            ListingType = p.ListingType,
            MonthlyRent = p.MonthlyRent,
            LeaseTermMonths = p.LeaseTermMonths,
            SecurityDeposit = p.SecurityDeposit,
            UtilitiesIncluded = p.UtilitiesIncluded,
            FurnishedStatus = p.FurnishedStatus,
            City = p.City,
            Neighborhood = p.Neighborhood,
            ZipCode = p.ZipCode,
            LotSize = p.LotSize,
            ParkingSpaces = p.ParkingSpaces,
            HasGarage = p.HasGarage,
            IsPetFriendly = p.IsPetFriendly,
            HasInUnitLaundry = p.HasInUnitLaundry,
            HasPool = p.HasPool,
            HasGym = p.HasGym,
            HasAirConditioning = p.HasAirConditioning,
            YearBuilt = p.YearBuilt,
            HasSolarPanels = p.HasSolarPanels,
            HasEnergyEfficientAppliances = p.HasEnergyEfficientAppliances,
            HasLEDLighting = p.HasLEDLighting,
            HasSmartThermostats = p.HasSmartThermostats,
            HasDoubleGlazedWindows = p.HasDoubleGlazedWindows,
            HasRainwaterHarvesting = p.HasRainwaterHarvesting,
            HasGreenRoof = p.HasGreenRoof,
            HasEnergyStarCertification = p.HasEnergyStarCertification,
            HasLEEDCertification = p.HasLEEDCertification,
            LEEDLevel = p.LEEDLevel,
            EcoScore = p.EcoScore
        };

        // Reusable DTO mapper (Lightweight Summary)
        private PropertySummaryResponseDto MapToSummaryDto(Property p) => new PropertySummaryResponseDto
        {
            Id = p.Id,
            Title = p.Title,
            Address = p.Address,
            Price = p.Price,
            Bedrooms = p.Bedrooms,
            Bathrooms = p.Bathrooms,
            Area = p.Area,
            PropertyType = p.PropertyType,
            Status = p.Status,
            Images = p.Images,
            OwnerName = p.User?.Username,
            ListingType = p.ListingType,
            MonthlyRent = p.MonthlyRent,
            City = p.City,
            EcoScore = p.EcoScore,
            CreatedAt = p.CreatedAt
        };


        // GET: api/properties/featured
        [HttpGet("featured")]
        [AllowAnonymous]
        public async Task<IActionResult> GetFeaturedProperties()
        {
            try
            {
                // Count total available properties
                var totalProperties = await _context.Properties
                    .Where(p => p.Status == "Available")
                    .CountAsync();

                if (totalProperties == 0)
                    return Ok(new List<PropertySummaryResponseDto>());

                var rand = new Random();
                var selectedProperties = new List<Property>();
                var selectedIds = new HashSet<int>(); // avoid duplicates

                // Keep selecting until we get 5 unique properties
                while (selectedProperties.Count < 5 && selectedIds.Count < totalProperties)
                {
                    int skip = rand.Next(0, totalProperties);

                    var property = await _context.Properties
                        .Include(p => p.User)
                        .Where(p => p.Status == "Available")
                        .Skip(skip)
                        .Take(1)
                        .FirstOrDefaultAsync();

                    if (property != null && selectedIds.Add(property.Id))
                        selectedProperties.Add(property);
                }

                // Convert Data to DTO
                var response = selectedProperties.Select(MapToSummaryDto).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving featured properties", error = ex.Message });
            }
        }



        // GET: api/properties
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllProperties()
        {
            try
            {
                var properties = await _context.Properties
                    .Include(p => p.User)
                    .OrderByDescending(p => p.CreatedAt)
                    .Take(100) // Safety limit: never return more than 100 properties without pagination
                    .ToListAsync();

                var response = properties.Select(MapToSummaryDto).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving properties", error = ex.Message });
            }
        }



        // GET: api/properties/paginated?page=1&pageSize=10
        [HttpGet("paginated")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPropertiesPaginated(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 50) pageSize = 10;

                var totalProperties = await _context.Properties.CountAsync();
                var totalPages = (int)Math.Ceiling(totalProperties / (double)pageSize);

                var properties = await _context.Properties
                    .Include(p => p.User)
                    .OrderByDescending(p => p.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var response = properties.Select(MapToSummaryDto).ToList();
                /*
                {
                    Id = p.Id,
                    Title = p.Title,
                    Description = p.Description,
                    Address = p.Address,
                    Price = p.Price,
                    Bedrooms = p.Bedrooms,
                    Bathrooms = p.Bathrooms,
                    Area = p.Area,
                    PropertyType = p.PropertyType,
                    Status = p.Status,
                    Images = p.Images,
                    UserId = p.UserId,
                    OwnerName = p.User?.Username,
                    CreatedAt = p.CreatedAt,
                    OwnerPhone = p.User?.PhoneNumber,
                    OwnerEmail = p.User?.Email,
                    ListingType = p.ListingType,
                    MonthlyRent = p.MonthlyRent,
                    LeaseTermMonths = p.LeaseTermMonths,
                    SecurityDeposit = p.SecurityDeposit,
                    UtilitiesIncluded = p.UtilitiesIncluded,
                    FurnishedStatus = p.FurnishedStatus,
                    City = p.City,
                    Neighborhood = p.Neighborhood,
                    ZipCode = p.ZipCode,
                    LotSize = p.LotSize,
                    ParkingSpaces = p.ParkingSpaces,
                    HasGarage = p.HasGarage,
                    IsPetFriendly = p.IsPetFriendly,
                    HasInUnitLaundry = p.HasInUnitLaundry,
                    HasPool = p.HasPool,
                    HasGym = p.HasGym,
                    HasAirConditioning = p.HasAirConditioning,
                    YearBuilt = p.YearBuilt,
                    HasSolarPanels = p.HasSolarPanels,
                    HasEnergyEfficientAppliances = p.HasEnergyEfficientAppliances,
                    HasLEDLighting = p.HasLEDLighting,
                    HasSmartThermostats = p.HasSmartThermostats,
                    HasDoubleGlazedWindows = p.HasDoubleGlazedWindows,
                    HasRainwaterHarvesting = p.HasRainwaterHarvesting,
                    HasGreenRoof = p.HasGreenRoof,
                    HasEnergyStarCertification = p.HasEnergyStarCertification,
                    HasLEEDCertification = p.HasLEEDCertification,
                    LEEDLevel = p.LEEDLevel,
                }).ToList();
                */

                return Ok(new
                {
                    properties = response,
                    currentPage = page,
                    pageSize = pageSize,
                    totalPages = totalPages,
                    totalProperties = totalProperties,
                    hasNextPage = page < totalPages
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving properties", error = ex.Message });
            }
        }




        // POST: api/properties/create
        [HttpPost("create")]
        [ApiExplorerSettings(IgnoreApi = true)]
        [Authorize(Roles = "Agent,Admin")]
        public async Task<IActionResult> CreateProperty([FromForm] PropertyDto dto, [FromForm] List<IFormFile> images)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                if (!IsAgentOrAdmin())
                    return Forbid("Only agents and administrators can create properties");

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // Validate rental properties
                if (dto.ListingType == "Rent")
                {
                    if (!dto.MonthlyRent.HasValue || dto.MonthlyRent <= 0)
                        return BadRequest(new { message = "Monthly rent is required for rental properties" });

                    if (!dto.LeaseTermMonths.HasValue)
                        return BadRequest(new { message = "Lease term is required for rental properties" });
                }

                // Validate images
                if (images == null || images.Count == 0)
                    return BadRequest(new { message = "At least one image is required" });

                if (images.Count > 10)
                    return BadRequest(new { message = "Maximum 10 images allowed" });

                // Upload images to Cloudinary
                var imageUrls = new List<string>();

                foreach (var image in images)
                {
                    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                    var extension = Path.GetExtension(image.FileName).ToLowerInvariant();

                    if (!allowedExtensions.Contains(extension))
                        return BadRequest(new { message = $"Invalid file type: {image.FileName}" });

                    if (image.Length > 5 * 1024 * 1024)
                        return BadRequest(new { message = $"File {image.FileName} exceeds 5MB limit" });

                    var imageUrl = await _cloudinaryService.UploadImageAsync(image, "restate/properties");
                    imageUrls.Add(imageUrl);
                }

                // Create property
                var property = new Property
                {
                    Title = dto.Title,
                    Description = dto.Description,
                    Address = dto.Address,
                    Price = dto.Price,
                    Bedrooms = dto.Bedrooms,
                    Bathrooms = dto.Bathrooms,
                    Area = dto.Area,
                    PropertyType = dto.PropertyType,
                    ListingType = dto.ListingType ?? "Sale",
                    City = dto.City,
                    Neighborhood = dto.Neighborhood,
                    ZipCode = dto.ZipCode,
                    LotSize = dto.LotSize,
                    ParkingSpaces = dto.ParkingSpaces,
                    HasGarage = dto.HasGarage,
                    YearBuilt = dto.YearBuilt,
                    IsPetFriendly = dto.IsPetFriendly,
                    HasInUnitLaundry = dto.HasInUnitLaundry,
                    HasPool = dto.HasPool,
                    HasGym = dto.HasGym,
                    HasAirConditioning = dto.HasAirConditioning,
                    HasSolarPanels = dto.HasSolarPanels,
                    HasEnergyEfficientAppliances = dto.HasEnergyEfficientAppliances,
                    HasLEDLighting = dto.HasLEDLighting,
                    HasSmartThermostats = dto.HasSmartThermostats,
                    HasDoubleGlazedWindows = dto.HasDoubleGlazedWindows,
                    HasRainwaterHarvesting = dto.HasRainwaterHarvesting,
                    HasGreenRoof = dto.HasGreenRoof,
                    HasEnergyStarCertification = dto.HasEnergyStarCertification,
                    HasLEEDCertification = dto.HasLEEDCertification,
                    LEEDLevel = dto.LEEDLevel,
                    UserId = userId,
                    Images = imageUrls,
                    Status = "Available",
                    MonthlyRent = dto.MonthlyRent,
                    LeaseTermMonths = dto.LeaseTermMonths,
                    SecurityDeposit = dto.SecurityDeposit,
                    UtilitiesIncluded = dto.UtilitiesIncluded,
                    FurnishedStatus = dto.FurnishedStatus ?? "Unfurnished",
                };

                _context.Properties.Add(property);
                await _context.SaveChangesAsync();

                await _notificationService.NotifyNewProperty(property);

                return CreatedAtAction(
                    nameof(GetPropertyById),
                    new { id = property.Id },
                    new PropertyResponseDto
                    {
                        Id = property.Id,
                        Title = property.Title,
                        Description = property.Description,
                        Address = property.Address,
                        Price = property.Price,
                        Bedrooms = property.Bedrooms,
                        Bathrooms = property.Bathrooms,
                        Area = property.Area,
                        PropertyType = property.PropertyType,
                        ListingType = property.ListingType,
                        City = property.City,
                        Neighborhood = property.Neighborhood,
                        ZipCode = property.ZipCode,
                        LotSize = property.LotSize,
                        ParkingSpaces = property.ParkingSpaces,
                        HasGarage = property.HasGarage,
                        YearBuilt = property.YearBuilt,
                        IsPetFriendly = property.IsPetFriendly,
                        HasInUnitLaundry = property.HasInUnitLaundry,
                        HasPool = property.HasPool,
                        HasGym = property.HasGym,
                        HasAirConditioning = property.HasAirConditioning,
                        Status = property.Status,
                        Images = property.Images,
                        UserId = property.UserId,
                        OwnerName = property.User?.Username,
                        CreatedAt = property.CreatedAt,
                        OwnerPhone = property.User?.PhoneNumber,
                        OwnerEmail = property.User?.Email,
                        MonthlyRent = property.MonthlyRent,
                        LeaseTermMonths = property.LeaseTermMonths,
                        SecurityDeposit = property.SecurityDeposit,
                        UtilitiesIncluded = property.UtilitiesIncluded,
                        FurnishedStatus = property.FurnishedStatus ?? "Unfurnished",
                    }
                );
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating property", error = ex.Message });
            }
        }


        // POST: api/properties/admin/create - Create property with image URLs (for admin dashboard)
        [HttpPost("admin/create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreatePropertyWithUrls([FromBody] PropertyCreateWithUrlsDto dto)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid adminUserId))
                    return Unauthorized(new { message = "User not authenticated" });

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // Validate images
                if (dto.Images == null || dto.Images.Count == 0)
                    return BadRequest(new { message = "At least one image URL is required" });

                if (dto.Images.Count > 10)
                    return BadRequest(new { message = "Maximum 10 images allowed" });

                // Use provided UserId if specified, otherwise use admin's ID
                Guid ownerId = dto.UserId ?? adminUserId;

                // Verify the target user exists if a specific UserId was provided
                if (dto.UserId.HasValue)
                {
                    var targetUser = await _context.Userss.FindAsync(dto.UserId.Value);
                    if (targetUser == null)
                        return BadRequest(new { message = "Selected user does not exist" });
                }

                // Create property
                var property = new Property
                {
                    Title = dto.Title,
                    Description = dto.Description,
                    Address = dto.Address,
                    Price = dto.Price,
                    Bedrooms = dto.Bedrooms,
                    Bathrooms = dto.Bathrooms,
                    Area = dto.Area,
                    PropertyType = dto.PropertyType,
                    ListingType = dto.ListingType ?? "Sale",
                    City = dto.City,
                    Neighborhood = dto.Neighborhood,
                    ZipCode = dto.ZipCode,
                    LotSize = dto.LotSize,
                    ParkingSpaces = dto.ParkingSpaces,
                    HasGarage = dto.HasGarage,
                    YearBuilt = dto.YearBuilt,
                    IsPetFriendly = dto.IsPetFriendly,
                    HasInUnitLaundry = dto.HasInUnitLaundry,
                    HasPool = dto.HasPool,
                    HasGym = dto.HasGym,
                    HasAirConditioning = dto.HasAirConditioning,
                    HasSolarPanels = dto.HasSolarPanels,
                    HasEnergyEfficientAppliances = dto.HasEnergyEfficientAppliances,
                    HasLEDLighting = dto.HasLEDLighting,
                    HasSmartThermostats = dto.HasSmartThermostats,
                    HasDoubleGlazedWindows = dto.HasDoubleGlazedWindows,
                    HasRainwaterHarvesting = dto.HasRainwaterHarvesting,
                    HasGreenRoof = dto.HasGreenRoof,
                    HasEnergyStarCertification = dto.HasEnergyStarCertification,
                    HasLEEDCertification = dto.HasLEEDCertification,
                    LEEDLevel = dto.LEEDLevel,
                    UserId = ownerId,
                    Images = dto.Images,
                    Status = "Available",
                    MonthlyRent = dto.MonthlyRent,
                    LeaseTermMonths = dto.LeaseTermMonths,
                    SecurityDeposit = dto.SecurityDeposit,
                    UtilitiesIncluded = dto.UtilitiesIncluded,
                    FurnishedStatus = dto.FurnishedStatus ?? "Unfurnished",
                };

                _context.Properties.Add(property);
                await _context.SaveChangesAsync();

                await _notificationService.NotifyNewProperty(property);

                return CreatedAtAction(
                    nameof(GetPropertyById),
                    new { id = property.Id },
                    new { message = "Property created successfully", propertyId = property.Id }
                );
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating property", error = ex.Message });
            }
        }


        [HttpGet("my-properties")]
        [Authorize(Roles = "Agent,Admin")]
        public async Task<IActionResult> GetMyProperties()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                if (!IsAgentOrAdmin())
                    return Forbid("Only agents and administrators can view their properties");

                var properties = await _context.Properties
                    .Include(p => p.User)
                    .Where(p => p.UserId == userId)
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                var response = properties.Select(MapToSummaryDto).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving your properties", error = ex.Message });
            }
        }

        // POST: api/properties/filter
        [HttpPost("filter")]
        [AllowAnonymous]
        public async Task<IActionResult> FilterProperties([FromBody] PropertyFilterDto filter)
        {
            try
            {
                // Log incoming filter for debugging
                Console.WriteLine($"Filter received - ListingType: {filter.ListingType}, PropertyTypes: {filter.PropertyTypes?.Count ?? 0}");

                var query = _context.Properties
                    .Include(p => p.User)
                    .AsQueryable();

                // --- LOCATION FILTERS ---
                if (!string.IsNullOrWhiteSpace(filter.City))
                    query = query.Where(p => p.City != null && p.City.ToLower().Contains(filter.City.ToLower()));

                if (!string.IsNullOrWhiteSpace(filter.Neighborhood))
                    query = query.Where(p => p.Neighborhood != null && p.Neighborhood.ToLower().Contains(filter.Neighborhood.ToLower()));

                if (!string.IsNullOrWhiteSpace(filter.ZipCode))
                    query = query.Where(p => p.ZipCode == filter.ZipCode);

                // --- LISTING TYPE FILTER ---
                if (!string.IsNullOrWhiteSpace(filter.ListingType))
                    query = query.Where(p => p.ListingType == filter.ListingType);

                // --- PROPERTY TYPES ---
                if (filter.PropertyTypes != null && filter.PropertyTypes.Any())
                    query = query.Where(p => filter.PropertyTypes.Contains(p.PropertyType));

                // --- STATUS ---
                if (filter.Status != null && filter.Status.Any())
                    query = query.Where(p => filter.Status.Contains(p.Status));

                // --- BEDROOMS/BATHROOMS ---
                if (filter.MinBedrooms.HasValue)
                    query = query.Where(p => p.Bedrooms >= filter.MinBedrooms.Value);

                if (filter.MinBathrooms.HasValue)
                    query = query.Where(p => p.Bathrooms >= filter.MinBathrooms.Value);

                // --- PRICE FILTERS (FOR SALE) ---
                if (filter.MinPrice.HasValue)
                    query = query.Where(p => p.Price >= filter.MinPrice.Value);

                if (filter.MaxPrice.HasValue)
                    query = query.Where(p => p.Price <= filter.MaxPrice.Value);

                // --- RENT FILTERS (FOR RENT) ---
                if (filter.MinMonthlyRent.HasValue)
                    query = query.Where(p => p.MonthlyRent.HasValue && p.MonthlyRent >= filter.MinMonthlyRent.Value);

                if (filter.MaxMonthlyRent.HasValue)
                    query = query.Where(p => p.MonthlyRent.HasValue && p.MonthlyRent <= filter.MaxMonthlyRent.Value);

                // --- RENTAL-SPECIFIC FILTERS ---

                // Lease Term Range
                if (filter.MinLeaseTermMonths.HasValue)
                    query = query.Where(p => p.LeaseTermMonths.HasValue && p.LeaseTermMonths >= filter.MinLeaseTermMonths.Value);

                if (filter.MaxLeaseTermMonths.HasValue)
                    query = query.Where(p => p.LeaseTermMonths.HasValue && p.LeaseTermMonths <= filter.MaxLeaseTermMonths.Value);

                // Security Deposit Range
                if (filter.MinSecurityDeposit.HasValue)
                    query = query.Where(p => p.SecurityDeposit.HasValue && p.SecurityDeposit >= filter.MinSecurityDeposit.Value);

                if (filter.MaxSecurityDeposit.HasValue)
                    query = query.Where(p => p.SecurityDeposit.HasValue && p.SecurityDeposit <= filter.MaxSecurityDeposit.Value);

                // Utilities Included - FIXED: Only filter if explicitly true
                if (filter.UtilitiesIncluded.HasValue && filter.UtilitiesIncluded.Value)
                    query = query.Where(p => p.UtilitiesIncluded == true);

                // Furnished Status
                if (!string.IsNullOrWhiteSpace(filter.FurnishedStatus))
                    query = query.Where(p => p.FurnishedStatus == filter.FurnishedStatus);

                // --- SIZE & AREA FILTERS ---

                // Property Area
                if (filter.MinArea.HasValue)
                    query = query.Where(p => p.Area >= filter.MinArea.Value);

                if (filter.MaxArea.HasValue)
                    query = query.Where(p => p.Area <= filter.MaxArea.Value);

                // Lot Size
                if (filter.MinLotSize.HasValue)
                    query = query.Where(p => p.LotSize.HasValue && p.LotSize >= filter.MinLotSize.Value);

                if (filter.MaxLotSize.HasValue)
                    query = query.Where(p => p.LotSize.HasValue && p.LotSize <= filter.MaxLotSize.Value);

                // --- YEAR BUILT ---
                if (filter.MinYearBuilt.HasValue)
                    query = query.Where(p => p.YearBuilt.HasValue && p.YearBuilt >= filter.MinYearBuilt.Value);

                if (filter.MaxYearBuilt.HasValue)
                    query = query.Where(p => p.YearBuilt.HasValue && p.YearBuilt <= filter.MaxYearBuilt.Value);

                // --- PARKING & GARAGE ---
                if (filter.MinParkingSpaces.HasValue)
                    query = query.Where(p => p.ParkingSpaces >= filter.MinParkingSpaces.Value);

                // FIXED: Only filter if explicitly true
                if (filter.HasGarage.HasValue && filter.HasGarage.Value)
                    query = query.Where(p => p.HasGarage == true);

                // --- AMENITIES (FIXED: Only filter when explicitly true) ---
                if (filter.IsPetFriendly.HasValue && filter.IsPetFriendly.Value)
                    query = query.Where(p => p.IsPetFriendly == true);

                if (filter.HasInUnitLaundry.HasValue && filter.HasInUnitLaundry.Value)
                    query = query.Where(p => p.HasInUnitLaundry == true);

                if (filter.HasPool.HasValue && filter.HasPool.Value)
                    query = query.Where(p => p.HasPool == true);

                if (filter.HasGym.HasValue && filter.HasGym.Value)
                    query = query.Where(p => p.HasGym == true);

                if (filter.HasAirConditioning.HasValue && filter.HasAirConditioning.Value)
                    query = query.Where(p => p.HasAirConditioning == true);

                // --- GREEN/ECO FEATURES (FIXED: Only filter when explicitly true) ---
                if (filter.HasSolarPanels.HasValue && filter.HasSolarPanels.Value)
                    query = query.Where(p => p.HasSolarPanels == true);

                if (filter.HasEnergyEfficientAppliances.HasValue && filter.HasEnergyEfficientAppliances.Value)
                    query = query.Where(p => p.HasEnergyEfficientAppliances == true);

                if (filter.HasLEDLighting.HasValue && filter.HasLEDLighting.Value)
                    query = query.Where(p => p.HasLEDLighting == true);

                if (filter.HasSmartThermostats.HasValue && filter.HasSmartThermostats.Value)
                    query = query.Where(p => p.HasSmartThermostats == true);

                if (filter.HasDoubleGlazedWindows.HasValue && filter.HasDoubleGlazedWindows.Value)
                    query = query.Where(p => p.HasDoubleGlazedWindows == true);

                if (filter.HasRainwaterHarvesting.HasValue && filter.HasRainwaterHarvesting.Value)
                    query = query.Where(p => p.HasRainwaterHarvesting == true);

                if (filter.HasGreenRoof.HasValue && filter.HasGreenRoof.Value)
                    query = query.Where(p => p.HasGreenRoof == true);

                if (filter.HasEnergyStarCertification.HasValue && filter.HasEnergyStarCertification.Value)
                    query = query.Where(p => p.HasEnergyStarCertification == true);

                if (filter.HasLEEDCertification.HasValue && filter.HasLEEDCertification.Value)
                    query = query.Where(p => p.HasLEEDCertification == true);

                // --- NEW LISTINGS ---
                if (filter.NewListingsDays.HasValue)
                {
                    var cutoffDate = DateTime.UtcNow.AddDays(-filter.NewListingsDays.Value);
                    query = query.Where(p => p.CreatedAt >= cutoffDate);
                }

                // --- HANDLE ECO SCORE FILTER (COMPUTED PROPERTY) ---
                List<Property> properties;
                int totalProperties;
                int totalPages;

                if (filter.MinEcoScore.HasValue)
                {
                    // Execute query first to get all matching properties
                    var allProperties = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();

                    // Filter by EcoScore in-memory (computed property)
                    var filteredByEcoScore = allProperties.Where(p => p.EcoScore >= filter.MinEcoScore.Value).ToList();

                    // Calculate pagination based on filtered results
                    totalProperties = filteredByEcoScore.Count;
                    totalPages = (int)Math.Ceiling(totalProperties / (double)filter.PageSize);

                    // Apply pagination
                    properties = filteredByEcoScore
                        .Skip((filter.Page - 1) * filter.PageSize)
                        .Take(filter.PageSize)
                        .ToList();
                }
                else
                {
                    // Normal flow without EcoScore filter
                    totalProperties = await query.CountAsync();
                    totalPages = (int)Math.Ceiling(totalProperties / (double)filter.PageSize);

                    Console.WriteLine($"Total properties found: {totalProperties}");

                    // Apply pagination
                    properties = await query
                        .OrderByDescending(p => p.CreatedAt)
                        .Skip((filter.Page - 1) * filter.PageSize)
                        .Take(filter.PageSize)
                        .ToListAsync();
                }

                // --- MAP TO RESPONSE DTO ---
                var response = properties.Select(MapToSummaryDto).ToList();

                Console.WriteLine($"Returning {response.Count} properties");

                return Ok(new
                {
                    properties = response,
                    currentPage = filter.Page,
                    pageSize = filter.PageSize,
                    totalPages = totalPages,
                    totalProperties = totalProperties,
                    hasNextPage = filter.Page < totalPages
                });
            }
            catch (Exception ex)
            {
                // Log the exception here (use your logging framework)
                Console.WriteLine($"Error filtering properties: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");

                return StatusCode(500, new
                {
                    message = "Error filtering properties",
                    error = ex.Message,
                    details = ex.InnerException?.Message
                });
            }
        }

        // GET: api/properties/todays-choice
        [HttpGet("todays-choice")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTodaysChoice()
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                var seed = today.Year * 10000 + today.Month * 100 + today.Day;
                var random = new Random(seed);

                var properties = await _context.Properties
                    .Include(p => p.User)
                    .Where(p => p.Status == "Available")
                    .ToListAsync();

                if (properties.Count == 0)
                    return Ok(new List<PropertyResponseDto>());

                var scoredProperties = properties
                    .Select(p => new
                    {
                        Property = p,
                        Score = CalculatePropertyScore(p, today)
                    })
                    .OrderByDescending(x => x.Score)
                    .ThenBy(x => random.Next())
                    .Take(5)
                    .Select(x => x.Property)
                    .ToList();

                var response = scoredProperties.Select(MapToSummaryDto).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving today's choice", error = ex.Message });
            }
        }

        // GET: api/properties/green-homes
        [HttpGet("green-homes")]
        [AllowAnonymous]
        public async Task<IActionResult> GetGreenHomes()
        {
            try
            {
                var properties = await _context.Properties
                    .Include(p => p.User)
                    .Where(p => p.Status == "Available" &&
                               (p.HasLEEDCertification ||
                                p.HasEnergyStarCertification ||
                                p.HasSolarPanels ||
                                p.HasEnergyEfficientAppliances ||
                                p.HasLEDLighting ||
                                p.HasSmartThermostats ||
                                p.HasDoubleGlazedWindows ||
                                p.HasRainwaterHarvesting ||
                                p.HasGreenRoof))
                    .ToListAsync();

                if (properties.Count == 0)
                    return Ok(new List<PropertyResponseDto>());

                // Score and sort by eco score
                var scoredProperties = properties
                    .OrderByDescending(p => p.EcoScore)
                    .Take(10)
                    .ToList();

                var response = scoredProperties.Select(MapToSummaryDto).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving green homes", error = ex.Message });
            }
        }



        private double CalculatePropertyScore(Property property, DateTime today)
        {
            double score = 0;

            var daysSinceCreated = (today - property.CreatedAt.Date).TotalDays;
            if (daysSinceCreated <= 7)
                score += 30;
            else if (daysSinceCreated <= 30)
                score += 20;
            else if (daysSinceCreated <= 90)
                score += 10;
            else
                score += 5;

            if (!string.IsNullOrWhiteSpace(property.Title))
                score += 5;
            if (!string.IsNullOrWhiteSpace(property.Description) && property.Description.Length > 50)
                score += 5;
            if (property.Images.Count >= 3)
                score += 5;

            if (property.Bedrooms >= 3)
                score += 5;
            if (property.Bathrooms >= 2)
                score += 5;
            if (property.Area >= 100)
                score += 5;

            if (property.Price >= 100000 && property.Price <= 1000000)
                score += 10;
            else if (property.Price >= 50000 && property.Price <= 2000000)
                score += 5;

            return score;
        }


        [HttpDelete("{id}")]
        [Authorize(Roles = "Agent,Admin")]
        public async Task<IActionResult> DeleteProperty(int id)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var property = await _context.Properties.FindAsync(id);

                if (property == null)
                    return NotFound(new { message = "Property not found" });

                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                if (userRole != "Admin" && property.UserId != userId)
                    return Forbid("You can only delete your own properties");

                foreach (var imageUrl in property.Images)
                {
                    if (imageUrl.Contains("cloudinary"))
                    {
                        var uri = new Uri(imageUrl);
                        var segments = uri.Segments;
                        var publicId = string.Join("", segments.Skip(segments.Length - 2))
                            .Replace("/", "")
                            .Split('.')[0];
                        await _cloudinaryService.DeleteImageAsync($"restate/properties/{publicId}");
                    }
                }

                _context.Properties.Remove(property);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Property deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting property", error = ex.Message });
            }
        }


        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPropertyById(int id)
        {
            try
            {
                var property = await _context.Properties
                    .Include(p => p.User)
                    .FirstOrDefaultAsync(p => p.Id == id);

                // Continuation of GetPropertyById
                if (property == null)
                    return NotFound(new { message = "Property not found" });

                return Ok(MapToDto(property));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving property", error = ex.Message });
            }
        }



        [HttpGet("{id}/edit")]
        [ApiExplorerSettings(IgnoreApi = true)]
        [Authorize(Roles = "Agent,Admin")]
        public async Task<IActionResult> GetPropertyForEdit(int id)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var property = await _context.Properties
                    .Include(p => p.User)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (property == null)
                    return NotFound(new { message = "Property not found" });

                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                if (userRole != "Admin" && property.UserId != userId)
                    return Forbid("You can only edit your own properties");

                return Ok(MapToDto(property));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving property", error = ex.Message });
            }
        }



        [HttpPut("{id}/with-images")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> UpdatePropertyWithImages(int id, [FromForm] IFormCollection formData, [FromForm] List<IFormFile>? newImages)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var property = await _context.Properties.FindAsync(id);
                if (property == null)
                    return NotFound(new { message = "Property not found" });

                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                if (userRole != "Admin" && property.UserId != userId)
                    return StatusCode(403, new { message = "You can only edit your own properties" });

                var oldPrice = property.Price;
                var oldStatus = property.Status;

                // 1. Basic Text/Numeric Fields
                property.Title = formData["title"].ToString();
                property.Description = formData["description"].ToString();
                property.Address = formData["address"].ToString();
                property.PropertyType = formData["propertyType"].ToString();
                property.ListingType = formData["listingType"].ToString();
                property.City = formData["city"].ToString();
                property.Neighborhood = formData["neighborhood"].ToString();
                property.ZipCode = formData["zipCode"].ToString();
                property.FurnishedStatus = formData["furnishedStatus"].ToString();

                if (decimal.TryParse(formData["price"], out var price)) property.Price = price;
                if (int.TryParse(formData["bedrooms"], out var bedrooms)) property.Bedrooms = bedrooms;
                if (int.TryParse(formData["bathrooms"], out var bathrooms)) property.Bathrooms = bathrooms;
                if (decimal.TryParse(formData["area"], out var area)) property.Area = area;
                if (int.TryParse(formData["parkingSpaces"], out var ps)) property.ParkingSpaces = ps;

                // Nullable Numeric Fields
                property.LotSize = decimal.TryParse(formData["lotSize"], out var ls) ? ls : null;
                property.YearBuilt = int.TryParse(formData["yearBuilt"], out var yb) ? yb : null;
                property.MonthlyRent = decimal.TryParse(formData["monthlyRent"], out var mr) ? mr : null;
                property.LeaseTermMonths = int.TryParse(formData["leaseTermMonths"], out var ltm) ? ltm : null;
                property.SecurityDeposit = decimal.TryParse(formData["securityDeposit"], out var sd) ? sd : null;

                // 2. Helper for Boolean Parsing (prevents repeated .ToString().ToLower())
                bool GetBool(string key) => formData.ContainsKey(key) && formData[key].ToString().ToLower() == "true";

                // Standard Amenities
                property.HasGarage = GetBool("hasGarage");
                property.IsPetFriendly = GetBool("isPetFriendly");
                property.HasInUnitLaundry = GetBool("hasInUnitLaundry");
                property.HasPool = GetBool("hasPool");
                property.HasGym = GetBool("hasGym");
                property.HasAirConditioning = GetBool("hasAirConditioning");
                property.UtilitiesIncluded = GetBool("utilitiesIncluded");

                // 🌿 Green Features (Matching your formData.append keys exactly)
                property.HasSolarPanels = GetBool("hasSolarPanels");
                property.HasEnergyEfficientAppliances = GetBool("hasEnergyEfficientAppliances");
                property.HasLEDLighting = GetBool("hasLEDLighting");
                property.HasSmartThermostats = GetBool("hasSmartThermostats");
                property.HasDoubleGlazedWindows = GetBool("hasDoubleGlazedWindows");
                property.HasRainwaterHarvesting = GetBool("hasRainwaterHarvesting");
                property.HasGreenRoof = GetBool("hasGreenRoof");

                // 🏆 Certifications & LEED
                property.HasEnergyStarCertification = GetBool("hasEnergyStarCertification");
                property.HasLEEDCertification = GetBool("hasLEEDCertification");

                // Important: Update LEEDLevel string after the boolean check
                if (property.HasLEEDCertification && formData.ContainsKey("leedLevel"))
                {
                    property.LEEDLevel = formData["leedLevel"].ToString();
                }
                else
                {
                    property.LEEDLevel = null;
                }

                // 3. Image Handling
                var existingImagesString = formData["existingImages"].ToString();
                var finalImages = new List<string>();

                if (!string.IsNullOrEmpty(existingImagesString))
                {
                    finalImages.AddRange(existingImagesString.Split(',').Select(x => x.Trim()).Where(x => !string.IsNullOrEmpty(x)));
                }

                if (newImages != null && newImages.Count > 0)
                {
                    foreach (var image in newImages)
                    {
                        var imageUrl = await _cloudinaryService.UploadImageAsync(image, "restate/properties");
                        finalImages.Add(imageUrl);
                    }
                }

                property.Images = finalImages;
                property.UpdatedAt = DateTime.UtcNow;

                // 4. Save and Notify
                _context.Properties.Update(property);
                await _context.SaveChangesAsync();

                if (oldPrice != property.Price) await _notificationService.NotifyPriceChange(id, oldPrice, property.Price);
                if (oldStatus != property.Status) await _notificationService.NotifyStatusChange(id, oldStatus, property.Status);

                return Ok(new { message = "Property updated successfully", propertyId = property.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating property", error = ex.Message });
            }
        }

        private bool IsAgentOrAdmin()
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            return role == "Agent" || role == "Admin";
        }

        // Helper method to get city for CityAdmin filtering
        private string? GetCityForFiltering()
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            if (role == "CityAdmin")
            {
                return User.FindFirst("city")?.Value;
            }
            return null; // Full Admin sees all
        }

        // ADMIN ENDPOINTS
        [HttpGet("admin/stats")]
        [Authorize(Roles = "Admin,CityAdmin")]
        public async Task<IActionResult> GetAdminStats()
        {
            var cityFilter = GetCityForFiltering();

            var usersQuery = _context.Userss.AsQueryable();
            var propertiesQuery = _context.Properties.AsQueryable();

            // Apply city filter for CityAdmin
            if (!string.IsNullOrEmpty(cityFilter))
            {
                usersQuery = usersQuery.Where(u => u.City == cityFilter);
                propertiesQuery = propertiesQuery.Where(p => p.City == cityFilter);
            }

            var totalUsers = await usersQuery.CountAsync();
            var totalProperties = await propertiesQuery.CountAsync();
            var activeProperties = await propertiesQuery.CountAsync(p => p.Status == "Available");
            var soldProperties = await propertiesQuery.CountAsync(p => p.Status == "Sold");
            var totalRevenue = await propertiesQuery.SumAsync(p => (decimal?)p.Price) ?? 0;

            var recentUsers = await usersQuery
                .OrderByDescending(u => u.CreatedAt)
                .Take(5)
                .Select(u => new { u.Id, u.Username, u.Email, u.CreatedAt })
                .ToListAsync();

            var recentProperties = await propertiesQuery
                .OrderByDescending(p => p.CreatedAt)
                .Take(5)
                .Select(p => new { p.Id, p.Title, p.Price, p.CreatedAt })
                .ToListAsync();

            return Ok(new
            {
                totalUsers,
                totalProperties,
                activeProperties,
                totalRevenue,
                soldProperties,
                recentUsers,
                recentProperties,
                cityFilter // Include so frontend knows what city is being filtered
            });
        }

        [HttpGet("admin/all-users")]
        [Authorize(Roles = "Admin,CityAdmin")]
        public async Task<IActionResult> GetAllUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 100)
        {
            var cityFilter = GetCityForFiltering();
            var query = _context.Userss.AsQueryable();

            // Apply city filter for CityAdmin
            if (!string.IsNullOrEmpty(cityFilter))
            {
                query = query.Where(u => u.City == cityFilter);
            }

            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Email,
                    u.PhoneNumber,
                    u.Role,
                    u.City,
                    u.ProfilePictureUrl,
                    u.CreatedAt,
                    PropertyCount = u.Properties != null ? u.Properties.Count : 0,
                    u.IsBanned,
                    u.BanReason,
                    u.BannedAt
                })
                .ToListAsync();

            return Ok(new { users });
        }

        [HttpGet("admin/all-properties")]
        [Authorize(Roles = "Admin,CityAdmin")]
        public async Task<IActionResult> GetAllPropertiesAdmin([FromQuery] int page = 1, [FromQuery] int pageSize = 100)
        {
            var cityFilter = GetCityForFiltering();
            var query = _context.Properties.Include(p => p.User).AsQueryable();

            // Apply city filter for CityAdmin
            if (!string.IsNullOrEmpty(cityFilter))
            {
                query = query.Where(p => p.City == cityFilter);
            }

            var properties = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new
                {
                    p.Id,
                    p.Title,
                    p.Address,
                    p.Price,
                    p.PropertyType,
                    p.City,
                    p.Status,
                    p.Images,
                    p.CreatedAt,
                    p.ListingType,
                    Owner = new { p.User.Username, p.User.Email },
                    OwnerName = p.User.Username
                })
                .ToListAsync();

            return Ok(new { properties });
        }

        [HttpDelete("admin/delete-user/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(Guid userId)
        {
            try
            {
                var user = await _context.Userss
                    .Include(u => u.Properties)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                    return NotFound(new { message = "User not found" });

                // Delete related reviews (has Restrict behavior)
                var userReviews = await _context.Reviews.Where(r => r.UserId == userId).ToListAsync();
                if (userReviews.Any())
                    _context.Reviews.RemoveRange(userReviews);

                // Delete chat messages where user is sender (has Restrict behavior)
                var userMessages = await _context.ChatMessages.Where(m => m.SenderId == userId).ToListAsync();
                if (userMessages.Any())
                    _context.ChatMessages.RemoveRange(userMessages);

                // Delete chat conversations where user is agent (has Restrict behavior)
                var agentConversations = await _context.ChatConversations.Where(c => c.AgentId == userId).ToListAsync();
                if (agentConversations.Any())
                    _context.ChatConversations.RemoveRange(agentConversations);

                // Delete chat conversations where user is the user
                var userConversations = await _context.ChatConversations.Where(c => c.UserId == userId).ToListAsync();
                if (userConversations.Any())
                    _context.ChatConversations.RemoveRange(userConversations);

                // Delete community posts and comments
                var userPosts = await _context.CommunityPosts.Where(p => p.UserId == userId).ToListAsync();
                if (userPosts.Any())
                    _context.CommunityPosts.RemoveRange(userPosts);

                var userComments = await _context.PostComments.Where(c => c.UserId == userId).ToListAsync();
                if (userComments.Any())
                    _context.PostComments.RemoveRange(userComments);

                // Delete post likes
                var userPostLikes = await _context.PostLikes.Where(pl => pl.UserId == userId).ToListAsync();
                if (userPostLikes.Any())
                    _context.PostLikes.RemoveRange(userPostLikes);

                // Delete user feedback
                var userFeedback = await _context.UserFeedback.Where(f => f.UserId == userId).ToListAsync();
                if (userFeedback.Any())
                    _context.UserFeedback.RemoveRange(userFeedback);

                // Delete liked properties
                var likedProperties = await _context.LikedProperties.Where(lp => lp.UserId == userId).ToListAsync();
                if (likedProperties.Any())
                    _context.LikedProperties.RemoveRange(likedProperties);

                // Delete agent requests
                var agentRequests = await _context.AgentRequests.Where(ar => ar.UserId == userId).ToListAsync();
                if (agentRequests.Any())
                    _context.AgentRequests.RemoveRange(agentRequests);

                // Delete reports
                var reports = await _context.Reports.Where(r => r.UserId == userId).ToListAsync();
                if (reports.Any())
                    _context.Reports.RemoveRange(reports);

                // Delete testimonial likes
                var testimonialLikes = await _context.TestimonialLikes.Where(tl => tl.UserId == userId).ToListAsync();
                if (testimonialLikes.Any())
                    _context.TestimonialLikes.RemoveRange(testimonialLikes);

                // Delete notifications (should cascade but let's be safe)
                var notifications = await _context.Notifications.Where(n => n.UserId == userId).ToListAsync();
                if (notifications.Any())
                    _context.Notifications.RemoveRange(notifications);

                // Delete notification preferences
                var notificationPrefs = await _context.NotificationPreferences.Where(np => np.UserId == userId).ToListAsync();
                if (notificationPrefs.Any())
                    _context.NotificationPreferences.RemoveRange(notificationPrefs);

                // Delete user's properties
                if (user.Properties != null && user.Properties.Any())
                    _context.Properties.RemoveRange(user.Properties);

                // Finally delete the user
                _context.Userss.Remove(user);
                await _context.SaveChangesAsync();

                return Ok(new { message = "User deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting user", error = ex.Message });
            }
        }

        [HttpPost("admin/make-admin/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> MakeUserAdmin(Guid userId)
        {
            var user = await _context.Userss.FindAsync(userId);

            if (user == null)
                return NotFound(new { message = "User not found" });

            user.Role = "Admin";
            await _context.SaveChangesAsync();

            return Ok(new { message = "User promoted to admin" });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePropertyJson(int id, [FromBody] PropertyUpdateDto dto)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var property = await _context.Properties.FindAsync(id);
                if (property == null)
                    return NotFound(new { message = "Property not found" });

                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                // Check permissions: Admin can edit all, CityAdmin can edit properties in their city, others can only edit their own
                if (userRole == "CityAdmin")
                {
                    var userCity = User.FindFirst("city")?.Value;
                    if (string.IsNullOrEmpty(userCity) || property.City != userCity)
                        return StatusCode(403, new { message = "You can only edit properties in your city" });
                }
                else if (userRole != "Admin" && property.UserId != userId)
                {
                    return StatusCode(403, new { message = "You can only edit your own properties" });
                }

                var oldPrice = property.Price;
                var oldStatus = property.Status;

                property.Title = dto.Title;
                property.Description = dto.Description;
                property.Address = dto.Address;
                property.Price = dto.Price;
                property.PropertyType = dto.PropertyType;
                property.City = dto.City;
                property.Neighborhood = dto.Neighborhood ?? string.Empty;
                property.ZipCode = dto.ZipCode ?? string.Empty;
                property.Bedrooms = dto.Bedrooms;
                property.Bathrooms = dto.Bathrooms;
                property.Area = dto.Area;
                property.LotSize = dto.LotSize;
                property.ParkingSpaces = dto.ParkingSpaces;
                property.HasGarage = dto.HasGarage;
                property.YearBuilt = dto.YearBuilt;
                property.IsPetFriendly = dto.IsPetFriendly;
                property.HasInUnitLaundry = dto.HasInUnitLaundry;
                property.HasPool = dto.HasPool;
                property.HasGym = dto.HasGym;
                property.HasAirConditioning = dto.HasAirConditioning;
                property.HasSolarPanels = dto.HasSolarPanels;
                property.HasEnergyEfficientAppliances = dto.HasEnergyEfficientAppliances;
                property.HasLEDLighting = dto.HasLEDLighting;
                property.HasSmartThermostats = dto.HasSmartThermostats;
                property.HasDoubleGlazedWindows = dto.HasDoubleGlazedWindows;
                property.HasRainwaterHarvesting = dto.HasRainwaterHarvesting;
                property.HasGreenRoof = dto.HasGreenRoof;
                property.HasEnergyStarCertification = dto.HasEnergyStarCertification;
                property.HasLEEDCertification = dto.HasLEEDCertification;
                property.LEEDLevel = dto.LEEDLevel;

                property.ListingType = dto.ListingType ?? "Sale";
                property.MonthlyRent = dto.MonthlyRent;
                property.LeaseTermMonths = dto.LeaseTermMonths;
                property.SecurityDeposit = dto.SecurityDeposit;
                property.UtilitiesIncluded = dto.UtilitiesIncluded;
                property.FurnishedStatus = dto.FurnishedStatus ?? "Unfurnished";

                property.UpdatedAt = DateTime.UtcNow;

                _context.Properties.Update(property);
                await _context.SaveChangesAsync();

                if (oldPrice != property.Price)
                    await _notificationService.NotifyPriceChange(id, oldPrice, property.Price);

                if (oldStatus != property.Status)
                    await _notificationService.NotifyStatusChange(id, oldStatus, property.Status);

                return Ok(new { message = "Property updated successfully", propertyId = property.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating property", error = ex.Message });
            }
        }

        // PATCH: api/Properties/{id}/status - Update property status (Admin/CityAdmin only)
        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Admin,CityAdmin")]
        public async Task<IActionResult> UpdatePropertyStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var property = await _context.Properties.FindAsync(id);

                if (property == null)
                    return NotFound(new { message = "Property not found" });

                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                // CityAdmin can only update properties in their city
                if (userRole == "CityAdmin")
                {
                    var userCity = User.FindFirst("city")?.Value;
                    if (string.IsNullOrEmpty(userCity) || property.City != userCity)
                        return StatusCode(403, new { message = "You can only update properties in your city" });
                }

                // Validate status based on listing type
                var validStatuses = property.ListingType?.ToLower() == "rent"
                    ? new[] { "Available", "Rented" }
                    : new[] { "Available", "Sold" };

                if (!validStatuses.Contains(dto.Status))
                    return BadRequest(new { message = $"Invalid status. Valid options are: {string.Join(", ", validStatuses)}" });

                var oldStatus = property.Status;
                property.Status = dto.Status;
                property.UpdatedAt = DateTime.UtcNow;

                _context.Properties.Update(property);
                await _context.SaveChangesAsync();

                // Notify users who liked this property about status change
                if (oldStatus != property.Status)
                {
                    await _notificationService.NotifyStatusChange(id, oldStatus, property.Status);
                }

                return Ok(new
                {
                    message = $"Property status updated to {dto.Status}",
                    property = new { id = property.Id, status = property.Status }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating property status", error = ex.Message });
            }
        }

        [HttpPut("{id}/mark-sold")]
        [Authorize(Roles = "Agent,Admin")]
        public async Task<IActionResult> MarkPropertyAsSold(int id)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var property = await _context.Properties.FindAsync(id);

                if (property == null)
                    return NotFound(new { message = "Property not found" });

                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                if (userRole != "Admin" && property.UserId != userId)
                    return Forbid("You can only modify your own properties");

                if (property.Status == "Sold")
                    return BadRequest(new { message = "Property is already marked as sold" });

                property.Status = "Sold";
                property.UpdatedAt = DateTime.UtcNow;

                _context.Properties.Update(property);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Property marked as sold successfully",
                    property = new { id = property.Id, status = property.Status }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating property status", error = ex.Message });
            }
        }

        [HttpPut("{id}/mark-rented")]
        [Authorize(Roles = "Agent,Admin")]
        public async Task<IActionResult> MarkPropertyAsRented(int id)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var property = await _context.Properties.FindAsync(id);

                if (property == null)
                    return NotFound(new { message = "Property not found" });

                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                if (userRole != "Admin" && property.UserId != userId)
                    return Forbid("You can only modify your own properties");

                if (property.Status == "Rented")
                    return BadRequest(new { message = "Property is already marked as rented" });

                property.Status = "Rented";
                property.UpdatedAt = DateTime.UtcNow;

                _context.Properties.Update(property);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Property marked as rented successfully",
                    property = new { id = property.Id, status = property.Status }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating property status", error = ex.Message });
            }
        }

        [HttpPut("{id}/mark-available")]
        [Authorize(Roles = "Agent,Admin")]
        public async Task<IActionResult> MarkPropertyAsAvailable(int id)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var property = await _context.Properties.FindAsync(id);

                if (property == null)
                    return NotFound(new { message = "Property not found" });

                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                if (userRole != "Admin" && property.UserId != userId)
                    return Forbid("You can only modify your own properties");

                if (property.Status == "Available")
                    return BadRequest(new { message = "Property is already marked as available" });

                property.Status = "Available";
                property.UpdatedAt = DateTime.UtcNow;

                _context.Properties.Update(property);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Property marked as available successfully",
                    property = new { id = property.Id, status = property.Status }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating property status", error = ex.Message });
            }
        }

        [HttpGet("charts")]
        [Authorize(Roles = "Admin,CityAdmin")]
        public async Task<IActionResult> GetDashboardCharts()
        {
            try
            {
                var cityFilter = GetCityForFiltering();

                var usersQuery = _context.Userss.Include(u => u.Properties).AsQueryable();
                var propertiesQuery = _context.Properties.AsQueryable();

                // Apply city filter for CityAdmin
                if (!string.IsNullOrEmpty(cityFilter))
                {
                    usersQuery = usersQuery.Where(u => u.City == cityFilter);
                    propertiesQuery = propertiesQuery.Where(p => p.City == cityFilter);
                }

                var usersWithProperties = await usersQuery.ToListAsync();

                var twelveMonthsAgo = DateTime.UtcNow.AddMonths(-12);
                var allProperties = await propertiesQuery.ToListAsync();

                var soldPropertiesLast12Months = allProperties
                    .Where(p => p.Status == "Sold" && p.UpdatedAt.HasValue && p.UpdatedAt.Value >= twelveMonthsAgo)
                    .ToList();

                var rentedPropertiesLast12Months = allProperties
                    .Where(p => p.Status == "Rented" && p.UpdatedAt.HasValue && p.UpdatedAt.Value >= twelveMonthsAgo)
                    .ToList();

                var topAgents = usersWithProperties
                    .Where(u => u.Properties?.Any(p => p.Status == "Sold") == true)
                    .Select(u => new
                    {
                        Username = u.Username,
                        SoldCount = u.Properties?.Count(p => p.Status == "Sold") ?? 0
                    })
                    .OrderByDescending(x => x.SoldCount)
                    .Take(5)
                    .ToList();

                var topAgentsRented = usersWithProperties
                    .Where(u => u.Properties?.Any(p => p.Status == "Rented") == true)
                    .Select(u => new
                    {
                        Username = u.Username,
                        RentedCount = u.Properties?.Count(p => p.Status == "Rented") ?? 0
                    })
                    .OrderByDescending(x => x.RentedCount)
                    .Take(5)
                    .ToList();

                var propertiesByPriceRange = await GetPriceRangeDistributionAsync();

                var propertiesByStatus = allProperties
                    .GroupBy(p => p.Status)
                    .Select(g => new { Status = g.Key, Count = g.Count() })
                    .ToList();

                var monthlyData = soldPropertiesLast12Months
                    .GroupBy(p => new {
                        Year = p.UpdatedAt.Value.Year,
                        Month = p.UpdatedAt.Value.Month
                    })
                    .Select(g => new
                    {
                        Month = $"{g.Key.Year}-{g.Key.Month:D2}",
                        Count = g.Count(),
                        AvgPrice = g.Average(p => (decimal?)p.Price) ?? 0
                    })
                    .OrderBy(x => x.Month)
                    .ToList();

                var propertiesSoldPerMonth = monthlyData
                    .Select(x => new { x.Month, x.Count })
                    .ToList();

                var avgPricePerMonth = monthlyData
                    .Select(x => new { x.Month, x.AvgPrice })
                    .ToList();

                // Rental monthly data
                var rentalMonthlyData = rentedPropertiesLast12Months
                    .GroupBy(p => new {
                        Year = p.UpdatedAt.Value.Year,
                        Month = p.UpdatedAt.Value.Month
                    })
                    .Select(g => new
                    {
                        Month = $"{g.Key.Year}-{g.Key.Month:D2}",
                        Count = g.Count(),
                        AvgRent = g.Average(p => (decimal?)p.MonthlyRent) ?? 0
                    })
                    .OrderBy(x => x.Month)
                    .ToList();

                var propertiesRentedPerMonth = rentalMonthlyData
                    .Select(x => new { x.Month, x.Count })
                    .ToList();

                var avgRentPerMonth = rentalMonthlyData
                    .Select(x => new { x.Month, x.AvgRent })
                    .ToList();

                var soldPropertiesAllTime = allProperties.Where(p => p.Status == "Sold").ToList();
                var rentedPropertiesAllTime = allProperties.Where(p => p.Status == "Rented").ToList();

                var propertiesSoldByCity = soldPropertiesAllTime
                    .Where(p => !string.IsNullOrWhiteSpace(p.City))
                    .GroupBy(p => p.City)
                    .Select(g => new { City = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .Take(10)
                    .ToList();

                var propertiesRentedByCity = rentedPropertiesAllTime
                    .Where(p => !string.IsNullOrWhiteSpace(p.City))
                    .GroupBy(p => p.City)
                    .Select(g => new { City = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .Take(10)
                    .ToList();

                var avgDaysToSell = soldPropertiesAllTime
                    .Where(p => p.UpdatedAt.HasValue)
                    .Select(p => (p.UpdatedAt.Value - p.CreatedAt).TotalDays)
                    .DefaultIfEmpty(0)
                    .Average();

                var avgDaysToRent = rentedPropertiesAllTime
                    .Where(p => p.UpdatedAt.HasValue)
                    .Select(p => (p.UpdatedAt.Value - p.CreatedAt).TotalDays)
                    .DefaultIfEmpty(0)
                    .Average();

                var topPropertyTypesBySalesVolume = soldPropertiesAllTime
                    .Where(p => !string.IsNullOrWhiteSpace(p.PropertyType))
                    .GroupBy(p => p.PropertyType)
                    .Select(g => new
                    {
                        PropertyType = g.Key,
                        TotalSalesVolume = g.Sum(p => p.Price),
                        Count = g.Count()
                    })
                    .OrderByDescending(x => x.TotalSalesVolume)
                    .Take(5)
                    .ToList();

                var propertyTypesDistribution = soldPropertiesAllTime
                    .GroupBy(p => p.PropertyType)
                    .Select(g => new { PropertyType = g.Key, Count = g.Count() })
                    .ToList();

                var topPropertyTypesByRentalVolume = rentedPropertiesAllTime
                    .Where(p => !string.IsNullOrWhiteSpace(p.PropertyType))
                    .GroupBy(p => p.PropertyType)
                    .Select(g => new
                    {
                        PropertyType = g.Key,
                        TotalRentalVolume = g.Sum(p => p.MonthlyRent ?? 0) * 12, // Annual rental value
                        Count = g.Count()
                    })
                    .OrderByDescending(x => x.TotalRentalVolume)
                    .Take(5)
                    .ToList();

                return Ok(new
                {
                    TopAgents = topAgents,
                    TopAgentsRented = topAgentsRented,
                    propertiesByStatus,
                    propertiesSoldPerMonth,
                    avgPricePerMonth,
                    propertiesSoldByCity,
                    avgDaysToSell = Math.Round(avgDaysToSell, 1),
                    topPropertyTypesBySalesVolume,
                    propertyTypesDistribution,
                    propertiesByPriceRange,
                    // Rental data
                    propertiesRentedPerMonth,
                    avgRentPerMonth,
                    propertiesRentedByCity,
                    avgDaysToRent = Math.Round(avgDaysToRent, 1),
                    topPropertyTypesByRentalVolume
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching chart data", error = ex.Message });
            }
        }

        private async Task<List<object>> GetPriceRangeDistributionAsync()
        {
            var priceRanges = new[]
            {
                new { Min = 0M, Max = 100000M, Label = "$0-$100K" },
                new { Min = 100000M, Max = 500000M, Label = "$100K-$500K" },
                new { Min = 500000M, Max = 1000000M, Label = "$500K-$1M" },
                new { Min = 1000000M, Max = 5000000M, Label = "$1M-$5M" },
                new { Min = 5000000M, Max = decimal.MaxValue, Label = "$5M+" }
            };

            var soldPrices = await _context.Properties
                .Where(p => p.Status == "Sold")
                .Select(p => p.Price)
                .ToListAsync();

            var propertiesByPriceRange = priceRanges.Select(range => new
            {
                Range = range.Label,
                Count = soldPrices.Count(p => p >= range.Min && p < range.Max)
            }).ToList<object>();

            return propertiesByPriceRange;
        }

        // GET: api/properties/your-choice - Personalized properties based on user preferences
        [HttpGet("your-choice")]
        [Authorize]
        public async Task<IActionResult> GetYourChoice([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                // Get user preferences
                var preferences = await _context.UserPreferences
                    .FirstOrDefaultAsync(p => p.UserId == userId);

                // Start with all available properties
                var query = _context.Properties
                    .Include(p => p.User)
                    .Where(p => p.Status == "Available")
                    .AsQueryable();

                bool hasFilters = false;

                if (preferences != null)
                {
                    // Apply property type filter
                    var propertyTypes = preferences.PropertyTypesList;
                    if (propertyTypes.Any())
                    {
                        query = query.Where(p => propertyTypes.Contains(p.PropertyType));
                        hasFilters = true;
                    }

                    // Apply bedroom filter
                    if (preferences.MinBedrooms.HasValue)
                    {
                        query = query.Where(p => p.Bedrooms >= preferences.MinBedrooms.Value);
                        hasFilters = true;
                    }
                    if (preferences.MaxBedrooms.HasValue)
                    {
                        query = query.Where(p => p.Bedrooms <= preferences.MaxBedrooms.Value);
                        hasFilters = true;
                    }

                    // Apply bathroom filter
                    if (preferences.MinBathrooms.HasValue)
                    {
                        query = query.Where(p => p.Bathrooms >= preferences.MinBathrooms.Value);
                        hasFilters = true;
                    }
                    if (preferences.MaxBathrooms.HasValue)
                    {
                        query = query.Where(p => p.Bathrooms <= preferences.MaxBathrooms.Value);
                        hasFilters = true;
                    }

                    // Apply price filter
                    if (preferences.MinPrice.HasValue)
                    {
                        query = query.Where(p => p.Price >= preferences.MinPrice.Value);
                        hasFilters = true;
                    }
                    if (preferences.MaxPrice.HasValue)
                    {
                        query = query.Where(p => p.Price <= preferences.MaxPrice.Value);
                        hasFilters = true;
                    }

                    // Apply area filter
                    if (preferences.MinArea.HasValue)
                    {
                        query = query.Where(p => p.Area >= preferences.MinArea.Value);
                        hasFilters = true;
                    }
                    if (preferences.MaxArea.HasValue)
                    {
                        query = query.Where(p => p.Area <= preferences.MaxArea.Value);
                        hasFilters = true;
                    }

                    // Apply city filter
                    var cities = preferences.CitiesList;
                    if (cities.Any())
                    {
                        query = query.Where(p => cities.Contains(p.City));
                        hasFilters = true;
                    }

                    // Apply listing type filter
                    if (!string.IsNullOrEmpty(preferences.ListingType) && preferences.ListingType != "Both")
                    {
                        query = query.Where(p => p.ListingType == preferences.ListingType);
                        hasFilters = true;
                    }

                    // Apply amenity filters
                    if (preferences.WantsGarage == true)
                    {
                        query = query.Where(p => p.HasGarage);
                        hasFilters = true;
                    }
                    if (preferences.WantsPetFriendly == true)
                    {
                        query = query.Where(p => p.IsPetFriendly);
                        hasFilters = true;
                    }
                    if (preferences.WantsPool == true)
                    {
                        query = query.Where(p => p.HasPool);
                        hasFilters = true;
                    }
                    if (preferences.WantsGym == true)
                    {
                        query = query.Where(p => p.HasGym);
                        hasFilters = true;
                    }
                    if (preferences.WantsAirConditioning == true)
                    {
                        query = query.Where(p => p.HasAirConditioning);
                        hasFilters = true;
                    }

                    // Apply green home preference
                    if (preferences.PrefersGreenHomes == true)
                    {
                        query = query.Where(p =>
                            p.HasLEEDCertification ||
                            p.HasEnergyStarCertification ||
                            p.HasSolarPanels ||
                            p.HasEnergyEfficientAppliances);
                        hasFilters = true;
                    }
                }

                // Get total count for pagination
                var totalCount = await query.CountAsync();

                // Ensure pageSize is reasonable
                pageSize = Math.Min(Math.Max(pageSize, 1), 50);
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                // Get properties with pagination
                var properties = await query
                    .OrderByDescending(p => p.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                // Apply eco score filter in memory (computed property)
                if (preferences?.MinEcoScore.HasValue == true)
                {
                    properties = properties.Where(p => p.EcoScore >= preferences.MinEcoScore.Value).ToList();
                }

                var response = properties.Select(p => new PropertyResponseDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Description = p.Description,
                    Address = p.Address,
                    Price = p.Price,
                    Bedrooms = p.Bedrooms,
                    Bathrooms = p.Bathrooms,
                    Area = p.Area,
                    PropertyType = p.PropertyType,
                    Status = p.Status,
                    Images = p.Images,
                    UserId = p.UserId,
                    OwnerName = p.User?.Username,
                    CreatedAt = p.CreatedAt,
                    OwnerPhone = p.User?.PhoneNumber,
                    OwnerEmail = p.User?.Email,
                    ListingType = p.ListingType,
                    MonthlyRent = p.MonthlyRent,
                    LeaseTermMonths = p.LeaseTermMonths,
                    SecurityDeposit = p.SecurityDeposit,
                    UtilitiesIncluded = p.UtilitiesIncluded,
                    FurnishedStatus = p.FurnishedStatus,
                    City = p.City,
                    Neighborhood = p.Neighborhood,
                    ZipCode = p.ZipCode,
                    LotSize = p.LotSize,
                    ParkingSpaces = p.ParkingSpaces,
                    HasGarage = p.HasGarage,
                    IsPetFriendly = p.IsPetFriendly,
                    HasInUnitLaundry = p.HasInUnitLaundry,
                    HasPool = p.HasPool,
                    HasGym = p.HasGym,
                    HasAirConditioning = p.HasAirConditioning,
                    YearBuilt = p.YearBuilt,
                    HasSolarPanels = p.HasSolarPanels,
                    HasEnergyEfficientAppliances = p.HasEnergyEfficientAppliances,
                    HasLEDLighting = p.HasLEDLighting,
                    HasSmartThermostats = p.HasSmartThermostats,
                    HasDoubleGlazedWindows = p.HasDoubleGlazedWindows,
                    HasRainwaterHarvesting = p.HasRainwaterHarvesting,
                    HasGreenRoof = p.HasGreenRoof,
                    HasEnergyStarCertification = p.HasEnergyStarCertification,
                    HasLEEDCertification = p.HasLEEDCertification,
                    LEEDLevel = p.LEEDLevel,
                    EcoScore = p.EcoScore
                }).ToList();

                return Ok(new
                {
                    properties = response,
                    pagination = new
                    {
                        currentPage = page,
                        pageSize = pageSize,
                        totalCount = totalCount,
                        totalPages = totalPages,
                        hasNextPage = page < totalPages,
                        hasPreviousPage = page > 1
                    },
                    hasPreferences = preferences != null,
                    hasFilters = hasFilters
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving your choice properties", error = ex.Message });
            }
        }
    }

    public class PropertyUpdateDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string PropertyType { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string? Neighborhood { get; set; }
        public string? ZipCode { get; set; }
        public int Bedrooms { get; set; }
        public int Bathrooms { get; set; }
        public decimal Area { get; set; }
        public decimal? LotSize { get; set; }
        public int ParkingSpaces { get; set; }
        public bool HasGarage { get; set; }
        public int? YearBuilt { get; set; }
        public bool IsPetFriendly { get; set; }
        public bool HasInUnitLaundry { get; set; }
        public bool HasPool { get; set; }
        public bool HasGym { get; set; }
        public bool HasAirConditioning { get; set; }
        public string? ListingType { get; set; } = "Sale";
        public decimal? MonthlyRent { get; set; }
        public int? LeaseTermMonths { get; set; }
        public decimal? SecurityDeposit { get; set; }
        public bool UtilitiesIncluded { get; set; } = false;
        public string? FurnishedStatus { get; set; } = "Unfurnished";
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
}