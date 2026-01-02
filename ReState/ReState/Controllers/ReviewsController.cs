using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReState.Data;
using ReState.Entities;
using ReState.Models;
using System.Security.Claims;

namespace ReState.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReviewsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST: api/reviews
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto dto)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                // Check if property exists
                var property = await _context.Properties.FindAsync(dto.PropertyId);
                if (property == null)
                    return NotFound(new { message = "Property not found" });

                // Check if user already reviewed this property
                var existingReview = await _context.Reviews
                    .FirstOrDefaultAsync(r => r.PropertyId == dto.PropertyId && r.UserId == userId);

                if (existingReview != null)
                    return BadRequest(new { message = "You have already reviewed this property" });

                var review = new Review
                {
                    PropertyId = dto.PropertyId,
                    UserId = userId,
                    Rating = dto.Rating,
                    Comment = dto.Comment,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Reviews.Add(review);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Review added successfully", reviewId = review.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating review", error = ex.Message });
            }
        }

        // GET: api/reviews/property/{propertyId}
        [HttpGet("property/{propertyId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPropertyReviews(int propertyId)
        {
            try
            {
                var reviews = await _context.Reviews
                    .Include(r => r.User)
                    .Where(r => r.PropertyId == propertyId)
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new ReviewResponseDto
                    {
                        Id = r.Id,
                        PropertyId = r.PropertyId,
                        Username = r.User!.Username,
                        UserProfilePicture = r.User.ProfilePictureUrl,
                        Rating = r.Rating,
                        Comment = r.Comment,
                        CreatedAt = r.CreatedAt,
                        IsVerified = r.IsVerified
                    })
                    .ToListAsync();

                var averageRating = reviews.Any() ? reviews.Average(r => r.Rating) : 0;

                return Ok(new
                {
                    reviews,
                    averageRating = Math.Round(averageRating, 1),
                    totalReviews = reviews.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching reviews", error = ex.Message });
            }
        }

        // DELETE: api/reviews/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteReview(int id)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var review = await _context.Reviews.FindAsync(id);
                if (review == null)
                    return NotFound(new { message = "Review not found" });

                if (review.UserId != userId)
                    return Forbid("You can only delete your own reviews");

                _context.Reviews.Remove(review);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Review deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting review", error = ex.Message });
            }
        }
    }
}