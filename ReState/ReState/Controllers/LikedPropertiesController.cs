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
    [Authorize]
    public class LikedPropertiesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public LikedPropertiesController(ApplicationDbContext context)
        {
            _context = context;
        }



        // POST: api/likedproperties/{propertyId}
        [HttpPost("{propertyId}")]
        public async Task<IActionResult> LikeProperty(int propertyId)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                // Check if property exists
                var propertyExists = await _context.Properties.AnyAsync(p => p.Id == propertyId);
                if (!propertyExists)
                    return NotFound(new { message = "Property not found" });

                // Check if already liked
                var existingLike = await _context.LikedProperties
                    .FirstOrDefaultAsync(lp => lp.UserId == userId && lp.PropertyId == propertyId);

                if (existingLike != null)
                    return BadRequest(new { message = "Property already liked" });

                // Create a new liked property
                var likedProperty = new LikedProperty
                {
                    UserId = userId,
                    PropertyId = propertyId
                };

                _context.LikedProperties.Add(likedProperty);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Property liked successfully", isLiked = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error liking property", error = ex.Message });
            }
        }



        // DELETE: api/likedproperties/{propertyId}
        [HttpDelete("{propertyId}")]
        public async Task<IActionResult> UnlikeProperty(int propertyId)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var likedProperty = await _context.LikedProperties
                    .FirstOrDefaultAsync(lp => lp.UserId == userId && lp.PropertyId == propertyId);

                if (likedProperty == null)
                    return NotFound(new { message = "Like not found" });

                _context.LikedProperties.Remove(likedProperty);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Property unliked successfully", isLiked = false });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error unliking property", error = ex.Message });
            }
        }



        // GET: api/likedproperties
        [HttpGet]
        public async Task<IActionResult> GetLikedProperties()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var likedProperties = await _context.LikedProperties
                    .Include(lp => lp.Property)
                      .ThenInclude(p => p.User)
                    .Where(lp => lp.UserId == userId)
                    .OrderByDescending(lp => lp.LikedAt)
                    .Select(lp => new PropertyResponseDto
                    {
                        Id = lp.Property.Id,
                        Title = lp.Property.Title,
                        Description = lp.Property.Description,
                        Address = lp.Property.Address,
                        Price = lp.Property.Price,
                        Bedrooms = lp.Property.Bedrooms,
                        Bathrooms = lp.Property.Bathrooms,
                        Area = lp.Property.Area,
                        PropertyType = lp.Property.PropertyType,
                        Status = lp.Property.Status,
                        Images = lp.Property.Images,
                        UserId = lp.Property.UserId,
                        OwnerName = lp.Property.User.Username,
                        CreatedAt = lp.Property.CreatedAt
                    })
                    .ToListAsync();

                return Ok(likedProperties);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving liked properties", error = ex.Message });
            }
        }



        // GET: api/likedproperties/check/{propertyId}
        [HttpGet("check/{propertyId}")]
        public async Task<IActionResult> CheckIfLiked(int propertyId)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var isLiked = await _context.LikedProperties
                    .AnyAsync(lp => lp.UserId == userId && lp.PropertyId == propertyId);

                return Ok(new { isLiked });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error checking like status", error = ex.Message });
            }
        }
    
    
    }
}