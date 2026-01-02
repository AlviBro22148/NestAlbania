// FILE LOCATION: Controllers/TestimonialsController.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReState.Data;
using ReState.Models;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace ReState.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestimonialsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TestimonialsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/testimonials
        [HttpGet]
        public async Task<IActionResult> GetAllTestimonials(
            [FromQuery] bool? verified = null,
            [FromQuery] int? minRating = null,
            [FromQuery] string? sortBy = "date")
        {
            try
            {
                var query = _context.Testimonials
                    .Include(t => t.User)
                    .Include(t => t.Property)
                    .AsQueryable();

                // Filter by verified status
                if (verified.HasValue)
                {
                    query = query.Where(t => t.IsVerified == verified.Value);
                }

                // Filter by minimum rating
                if (minRating.HasValue)
                {
                    query = query.Where(t => t.Rating >= minRating.Value);
                }

                // Sort
                query = sortBy?.ToLower() switch
                {
                    "rating" => query.OrderByDescending(t => t.Rating),
                    "helpful" => query.OrderByDescending(t => t.HelpfulCount),
                    _ => query.OrderByDescending(t => t.CreatedAt)
                };

                var testimonials = await query.Select(t => new
                {
                    t.Id,
                    t.UserId,
                    username = t.User != null ? t.User.Username : "Anonymous",
                    userProfilePicture = t.User != null ? t.User.ProfilePictureUrl ?? "" : "",
                    clientEmail = t.User != null ? t.User.Email : "",
                    serviceType = t.ServiceType ?? "",
                    propertyType = t.Property != null ? t.Property.PropertyType : t.ServiceType ?? "General",
                    location = t.Property != null ? $"{t.Property.City}, {t.Property.ListingType}" : "N/A",
                    t.Rating,
                    t.Comment,
                    createdAt = t.CreatedAt,
                    agentName = "",
                    t.IsVerified,
                    t.HelpfulCount,
                    propertyId = t.PropertyId,
                    propertyTitle = t.Property != null ? t.Property.Title : null,
                    t.UpdatedAt
                }).ToListAsync();

                return Ok(testimonials);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching testimonials", error = ex.Message });
            }
        }

        // GET: api/testimonials/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTestimonialById(int id)
        {
            try
            {
                var testimonial = await _context.Testimonials
                    .Include(t => t.User)
                    .Include(t => t.Property)
                    .Where(t => t.Id == id)
                    .Select(t => new
                    {
                        t.Id,
                        t.UserId,
                        ClientName = t.User != null ? t.User.Username : "Anonymous",
                        ClientImage = t.User != null ? t.User.ProfilePictureUrl ?? "" : "",
                        PropertyType = t.Property != null ? t.Property.PropertyType : t.ServiceType ?? "General",
                        Location = t.Property != null ? $"{t.Property.City}, {t.Property.ListingType}" : "N/A",
                        t.Rating,
                        t.Comment,
                        Date = t.CreatedAt,
                        AgentName = "",
                        t.IsVerified,
                        t.HelpfulCount,
                        PropertyId = t.PropertyId,
                        PropertyName = t.Property != null ? t.Property.Title : null
                    })
                    .FirstOrDefaultAsync();

                if (testimonial == null)
                {
                    return NotFound(new { message = "Testimonial not found" });
                }

                return Ok(testimonial);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching testimonial", error = ex.Message });
            }
        }

        // GET: api/testimonials/stats
        [HttpGet("stats")]
        public async Task<IActionResult> GetTestimonialStats()
        {
            try
            {
                var testimonials = await _context.Testimonials.ToListAsync();

                var stats = new
                {
                    totalTestimonials = testimonials.Count,
                    averageRating = testimonials.Any() ? Math.Round(testimonials.Average(t => t.Rating), 1) : 0,
                    verifiedCount = testimonials.Count(t => t.IsVerified),
                    pendingCount = testimonials.Count(t => !t.IsVerified),
                    unverifiedCount = testimonials.Count(t => !t.IsVerified),
                    // Star distribution as object for frontend compatibility
                    starDistribution = new Dictionary<int, int>
                    {
                        { 5, testimonials.Count(t => t.Rating == 5) },
                        { 4, testimonials.Count(t => t.Rating == 4) },
                        { 3, testimonials.Count(t => t.Rating == 3) },
                        { 2, testimonials.Count(t => t.Rating == 2) },
                        { 1, testimonials.Count(t => t.Rating == 1) }
                    },
                    // Keep old format for backward compatibility
                    fiveStarCount = testimonials.Count(t => t.Rating == 5),
                    fourStarCount = testimonials.Count(t => t.Rating == 4),
                    threeStarCount = testimonials.Count(t => t.Rating == 3),
                    twoStarCount = testimonials.Count(t => t.Rating == 2),
                    oneStarCount = testimonials.Count(t => t.Rating == 1)
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching stats", error = ex.Message });
            }
        }

        // GET: api/testimonials/my-testimonials
        [Authorize]
        [HttpGet("my-testimonials")]
        public async Task<IActionResult> GetMyTestimonials()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");

                var testimonials = await _context.Testimonials
                    .Include(t => t.User)
                    .Include(t => t.Property)
                    .Where(t => t.UserId == userId)
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => new
                    {
                        t.Id,
                        t.UserId,
                        ClientName = t.User!.Username,
                        ClientImage = t.User.ProfilePictureUrl ?? "",
                        PropertyType = t.Property != null ? t.Property.PropertyType : t.ServiceType ?? "General",
                        Location = t.Property != null ? $"{t.Property.City}, {t.Property.ListingType}" : "N/A",
                        t.Rating,
                        t.Comment,
                        Date = t.CreatedAt,
                        AgentName = "",
                        t.IsVerified,
                        t.HelpfulCount,
                        PropertyId = t.PropertyId,
                        PropertyName = t.Property != null ? t.Property.Title : null
                    })
                    .ToListAsync();

                return Ok(testimonials);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching your testimonials", error = ex.Message });
            }
        }

        // GET: api/testimonials/top-rated
        [HttpGet("top-rated")]
        public async Task<IActionResult> GetTopRatedTestimonials([FromQuery] int limit = 5, [FromQuery] int count = 5)
        {
            try
            {
                // Use whichever parameter is provided (count or limit)
                var takeCount = count > limit ? count : limit;

                // First try to get verified top-rated testimonials
                var query = _context.Testimonials
                    .Include(t => t.User)
                    .Include(t => t.Property)
                    .Where(t => t.Rating >= 4);

                // Check if there are any verified testimonials
                var hasVerified = await query.AnyAsync(t => t.IsVerified);

                // If there are verified ones, filter by them; otherwise show all high-rated
                if (hasVerified)
                {
                    query = query.Where(t => t.IsVerified);
                }

                var topRated = await query
                    .OrderByDescending(t => t.Rating)
                    .ThenByDescending(t => t.HelpfulCount)
                    .Take(takeCount)
                    .Select(t => new
                    {
                        t.Id,
                        t.UserId,
                        username = t.User != null ? t.User.Username : "Anonymous",
                        userProfilePicture = t.User != null ? t.User.ProfilePictureUrl ?? "" : "",
                        serviceType = t.ServiceType ?? "",
                        propertyType = t.Property != null ? t.Property.PropertyType : t.ServiceType ?? "General",
                        location = t.Property != null ? $"{t.Property.City}, {t.Property.ListingType}" : "N/A",
                        t.Rating,
                        t.Comment,
                        createdAt = t.CreatedAt,
                        agentName = "",
                        t.IsVerified,
                        t.HelpfulCount,
                        propertyId = t.PropertyId,
                        propertyTitle = t.Property != null ? t.Property.Title : null
                    })
                    .ToListAsync();

                return Ok(topRated);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching top rated testimonials", error = ex.Message });
            }
        }

        // GET: api/testimonials/user-properties
        [Authorize]
        [HttpGet("user-properties")]
        public async Task<IActionResult> GetUserPropertiesForReview()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");

                var propertiesWithoutReviews = await _context.Properties
                    .Where(p => p.UserId == userId)
                    .Where(p => !_context.Testimonials.Any(t => t.PropertyId == p.Id && t.UserId == userId))
                    .Select(p => new
                    {
                        p.Id,
                        p.Title,
                        p.PropertyType,
                        Location = $"{p.City}, {p.ListingType}"
                    })
                    .ToListAsync();

                return Ok(propertiesWithoutReviews);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching properties", error = ex.Message });
            }
        }

        // POST: api/testimonials
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateTestimonial([FromBody] CreateTestimonialDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");

                if (dto.PropertyId.HasValue)
                {
                    var existingReview = await _context.Testimonials
                        .AnyAsync(t => t.UserId == userId && t.PropertyId == dto.PropertyId);

                    if (existingReview)
                    {
                        return BadRequest(new { message = "You have already reviewed this property" });
                    }
                }

                var testimonial = new Testimonial
                {
                    UserId = userId,
                    PropertyId = dto.PropertyId,
                    Rating = dto.Rating,
                    Comment = dto.Comment,
                    ServiceType = dto.ServiceType,
                    IsVerified = false,
                    HelpfulCount = 0,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Testimonials.Add(testimonial);
                await _context.SaveChangesAsync();

                var created = await _context.Testimonials
                    .Include(t => t.User)
                    .Include(t => t.Property)
                    .Where(t => t.Id == testimonial.Id)
                    .Select(t => new
                    {
                        t.Id,
                        t.UserId,
                        ClientName = t.User!.Username,
                        ClientImage = t.User.ProfilePictureUrl ?? "",
                        PropertyType = t.Property != null ? t.Property.PropertyType : t.ServiceType ?? "General",
                        Location = t.Property != null ? $"{t.Property.City}, {t.Property.ListingType}" : "N/A",
                        t.Rating,
                        t.Comment,
                        Date = t.CreatedAt,
                        AgentName = "",
                        t.IsVerified,
                        t.HelpfulCount
                    })
                    .FirstOrDefaultAsync();

                return CreatedAtAction(nameof(GetTestimonialById), new { id = testimonial.Id }, created);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating testimonial", error = ex.Message });
            }
        }

        // PUT: api/testimonials/{id}
        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTestimonial(int id, [FromBody] UpdateTestimonialDto dto)
        {
            try
            {
                var testimonial = await _context.Testimonials.FindAsync(id);
                if (testimonial == null)
                {
                    return NotFound(new { message = "Testimonial not found" });
                }

                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                if (testimonial.UserId != userId && userRole != "Admin")
                {
                    return Forbid();
                }

                testimonial.Rating = dto.Rating;
                testimonial.Comment = dto.Comment;
                testimonial.ServiceType = dto.ServiceType;
                testimonial.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Testimonial updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating testimonial", error = ex.Message });
            }
        }

        // DELETE: api/testimonials/{id}
        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTestimonial(int id)
        {
            try
            {
                var testimonial = await _context.Testimonials.FindAsync(id);
                if (testimonial == null)
                {
                    return NotFound(new { message = "Testimonial not found" });
                }

                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                if (testimonial.UserId != userId && userRole != "Admin")
                {
                    return Forbid();
                }

                _context.Testimonials.Remove(testimonial);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Testimonial deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting testimonial", error = ex.Message });
            }
        }

        // POST: api/testimonials/{id}/helpful - Toggle like/unlike
        [Authorize]
        [HttpPost("{id}/helpful")]
        public async Task<IActionResult> ToggleHelpful(int id)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");

                var testimonial = await _context.Testimonials.FindAsync(id);
                if (testimonial == null)
                {
                    return NotFound(new { message = "Testimonial not found" });
                }

                // Check if user already liked this testimonial
                var existingLike = await _context.TestimonialLikes
                    .FirstOrDefaultAsync(tl => tl.TestimonialId == id && tl.UserId == userId);

                bool isLiked;
                if (existingLike != null)
                {
                    // Unlike - remove the like
                    _context.TestimonialLikes.Remove(existingLike);
                    testimonial.HelpfulCount = Math.Max(0, testimonial.HelpfulCount - 1);
                    isLiked = false;
                }
                else
                {
                    // Like - add new like
                    _context.TestimonialLikes.Add(new TestimonialLike
                    {
                        TestimonialId = id,
                        UserId = userId,
                        CreatedAt = DateTime.UtcNow
                    });
                    testimonial.HelpfulCount++;
                    isLiked = true;
                }

                await _context.SaveChangesAsync();

                return Ok(new { helpfulCount = testimonial.HelpfulCount, isLiked });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error toggling helpful", error = ex.Message });
            }
        }

        // GET: api/testimonials/user-likes - Get user's liked testimonials
        [Authorize]
        [HttpGet("user-likes")]
        public async Task<IActionResult> GetUserLikes()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");

                var likedIds = await _context.TestimonialLikes
                    .Where(tl => tl.UserId == userId)
                    .Select(tl => tl.TestimonialId)
                    .ToListAsync();

                return Ok(likedIds);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching likes", error = ex.Message });
            }
        }

        // PUT: api/testimonials/{id}/verify
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/verify")]
        public async Task<IActionResult> VerifyTestimonial(int id)
        {
            try
            {
                var testimonial = await _context.Testimonials
                    .Include(t => t.User)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (testimonial == null)
                {
                    return NotFound(new { message = "Testimonial not found" });
                }

                testimonial.IsVerified = !testimonial.IsVerified;
                await _context.SaveChangesAsync();

                // TODO: Send notification to user when verified
                // await _notificationService.NotifyTestimonialVerified(testimonial.UserId, testimonial.Id);

                return Ok(new { isVerified = testimonial.IsVerified });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error verifying testimonial", error = ex.Message });
            }
        }

        // POST: api/testimonials/bulk-verify
        [Authorize(Roles = "Admin")]
        [HttpPost("bulk-verify")]
        public async Task<IActionResult> BulkVerifyTestimonials([FromBody] BulkVerifyDto dto)
        {
            try
            {
                var testimonials = await _context.Testimonials
                    .Where(t => dto.TestimonialIds.Contains(t.Id))
                    .ToListAsync();

                foreach (var testimonial in testimonials)
                {
                    testimonial.IsVerified = dto.Verify;
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"Successfully {(dto.Verify ? "verified" : "unverified")} {testimonials.Count} testimonials",
                    count = testimonials.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error bulk verifying testimonials", error = ex.Message });
            }
        }

        // DELETE: api/testimonials/bulk-delete
        [Authorize(Roles = "Admin")]
        [HttpDelete("bulk-delete")]
        public async Task<IActionResult> BulkDeleteTestimonials([FromBody] BulkDeleteDto dto)
        {
            try
            {
                var testimonials = await _context.Testimonials
                    .Where(t => dto.TestimonialIds.Contains(t.Id))
                    .ToListAsync();

                _context.Testimonials.RemoveRange(testimonials);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"Successfully deleted {testimonials.Count} testimonials",
                    count = testimonials.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error bulk deleting testimonials", error = ex.Message });
            }
        }

        // GET: api/testimonials/property/{propertyId}
        [HttpGet("property/{propertyId}")]
        public async Task<IActionResult> GetPropertyTestimonials(int propertyId)
        {
            try
            {
                var testimonials = await _context.Testimonials
                    .Include(t => t.User)
                    .Where(t => t.PropertyId == propertyId)
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => new
                    {
                        t.Id,
                        t.UserId,
                        ClientName = t.User!.Username,
                        ClientImage = t.User.ProfilePictureUrl ?? "",
                        t.Rating,
                        t.Comment,
                        Date = t.CreatedAt,
                        t.IsVerified,
                        t.HelpfulCount
                    })
                    .ToListAsync();

                return Ok(testimonials);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching property testimonials", error = ex.Message });
            }
        }

        // GET: api/testimonials/pending (Admin only)
        [Authorize(Roles = "Admin")]
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingTestimonials()
        {
            try
            {
                var pending = await _context.Testimonials
                    .Include(t => t.User)
                    .Include(t => t.Property)
                    .Where(t => !t.IsVerified)
                    .OrderBy(t => t.CreatedAt)
                    .Select(t => new
                    {
                        t.Id,
                        t.UserId,
                        ClientName = t.User!.Username,
                        ClientEmail = t.User.Email,
                        ClientImage = t.User.ProfilePictureUrl ?? "",
                        PropertyType = t.Property != null ? t.Property.PropertyType : t.ServiceType ?? "General",
                        Location = t.Property != null ? $"{t.Property.City}, {t.Property.ListingType}" : "N/A",
                        t.Rating,
                        t.Comment,
                        Date = t.CreatedAt,
                        t.IsVerified,
                        t.HelpfulCount,
                        PropertyId = t.PropertyId,
                        PropertyName = t.Property != null ? t.Property.Title : null
                    })
                    .ToListAsync();

                return Ok(pending);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching pending testimonials", error = ex.Message });
            }
        }
    }

    // DTOs
    public class CreateTestimonialDto
    {
        public int? PropertyId { get; set; }

        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Comment { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? ServiceType { get; set; }
    }

    public class UpdateTestimonialDto
    {
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Comment { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? ServiceType { get; set; }
    }

    public class BulkVerifyDto
    {
        [Required]
        public List<int> TestimonialIds { get; set; } = new();

        [Required]
        public bool Verify { get; set; }
    }

    public class BulkDeleteDto
    {
        [Required]
        public List<int> TestimonialIds { get; set; } = new();
    }
}