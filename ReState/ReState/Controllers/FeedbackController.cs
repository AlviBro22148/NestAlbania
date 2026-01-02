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
    public class FeedbackController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<FeedbackController> _logger;
        private readonly INotificationService _notificationService;

        public FeedbackController(ApplicationDbContext context, ILogger<FeedbackController> logger, INotificationService notificationService)
        {
            _context = context;
            _logger = logger;
            _notificationService = notificationService;
        }

        // POST: api/feedback
        [HttpPost]
        public async Task<IActionResult> SubmitFeedback([FromBody] CreateFeedbackDto dto)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                // Get username for notification
                var user = await _context.Userss.FindAsync(userId);
                var username = user?.Username ?? "Unknown User";

                var feedback = new UserFeedback
                {
                    UserId = userId,
                    FeedbackType = dto.FeedbackType,
                    Subject = dto.Subject,
                    Message = dto.Message,
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow
                };

                _context.UserFeedback.Add(feedback);
                await _context.SaveChangesAsync();

                // Notify all admins about the new feedback
                await _notificationService.NotifyAdminsNewFeedback(username, dto.FeedbackType, dto.Subject);

                return Ok(new { message = "Feedback submitted successfully", feedbackId = feedback.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error submitting feedback: {ex.Message}");
                return StatusCode(500, new { message = "Error submitting feedback", error = ex.Message });
            }
        }

        // GET: api/feedback/my-feedback
        [HttpGet("my-feedback")]
        public async Task<IActionResult> GetMyFeedback()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var feedback = await _context.UserFeedback
                    .Where(f => f.UserId == userId)
                    .OrderByDescending(f => f.CreatedAt)
                    .Select(f => new FeedbackResponseDto
                    {
                        Id = f.Id,
                        FeedbackType = f.FeedbackType,
                        Subject = f.Subject,
                        Message = f.Message,
                        Status = f.Status,
                        CreatedAt = f.CreatedAt
                    })
                    .ToListAsync();

                return Ok(feedback);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching feedback: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching feedback", error = ex.Message });
            }
        }

        // ===== ADMIN ENDPOINTS =====

        // GET: api/feedback/admin/all
        [HttpGet("admin/all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllFeedback([FromQuery] string? status = null, [FromQuery] string? type = null)
        {
            try
            {
                var query = _context.UserFeedback
                    .Include(f => f.User)
                    .AsQueryable();

                // Filter by status if provided
                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(f => f.Status == status);
                }

                // Filter by type if provided
                if (!string.IsNullOrEmpty(type))
                {
                    query = query.Where(f => f.FeedbackType == type);
                }

                var feedback = await query
                    .OrderByDescending(f => f.CreatedAt)
                    .Select(f => new AdminFeedbackResponseDto
                    {
                        Id = f.Id,
                        UserId = f.UserId,
                        Username = f.User!.Username,
                        UserEmail = f.User.Email,
                        FeedbackType = f.FeedbackType,
                        Subject = f.Subject,
                        Message = f.Message,
                        Status = f.Status,
                        CreatedAt = f.CreatedAt
                    })
                    .ToListAsync();

                return Ok(feedback);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching all feedback: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching feedback", error = ex.Message });
            }
        }

        // GET: api/feedback/admin/stats
        [HttpGet("admin/stats")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetFeedbackStats()
        {
            try
            {
                var totalFeedback = await _context.UserFeedback.CountAsync();
                var pendingCount = await _context.UserFeedback.CountAsync(f => f.Status == "Pending");
                var reviewedCount = await _context.UserFeedback.CountAsync(f => f.Status == "Reviewed");
                var resolvedCount = await _context.UserFeedback.CountAsync(f => f.Status == "Resolved");

                var bugCount = await _context.UserFeedback.CountAsync(f => f.FeedbackType == "Bug");
                var featureCount = await _context.UserFeedback.CountAsync(f => f.FeedbackType == "Feature Request");
                var generalCount = await _context.UserFeedback.CountAsync(f => f.FeedbackType == "General");

                // Recent feedback (last 7 days)
                var weekAgo = DateTime.UtcNow.AddDays(-7);
                var recentCount = await _context.UserFeedback.CountAsync(f => f.CreatedAt >= weekAgo);

                return Ok(new
                {
                    totalFeedback,
                    pendingCount,
                    reviewedCount,
                    resolvedCount,
                    bugCount,
                    featureCount,
                    generalCount,
                    recentCount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching feedback stats: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching stats", error = ex.Message });
            }
        }

        // PUT: api/feedback/admin/{id}/status
        [HttpPut("admin/{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateFeedbackStatus(int id, [FromBody] UpdateFeedbackStatusDto dto)
        {
            try
            {
                var feedback = await _context.UserFeedback
                    .Include(f => f.User)
                    .FirstOrDefaultAsync(f => f.Id == id);

                if (feedback == null)
                    return NotFound(new { message = "Feedback not found" });

                var previousStatus = feedback.Status;
                feedback.Status = dto.Status;
                await _context.SaveChangesAsync();

                // Send notification when feedback is resolved
                if (dto.Status == "Resolved" && previousStatus != "Resolved" && feedback.User != null)
                {
                    await _notificationService.NotifyFeedbackResolved(
                        feedback.UserId,
                        feedback.User.Username,
                        feedback.Subject
                    );
                }

                return Ok(new { message = "Feedback status updated successfully", status = feedback.Status });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating feedback status: {ex.Message}");
                return StatusCode(500, new { message = "Error updating status", error = ex.Message });
            }
        }

        // DELETE: api/feedback/admin/{id}
        [HttpDelete("admin/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteFeedback(int id)
        {
            try
            {
                var feedback = await _context.UserFeedback.FindAsync(id);
                if (feedback == null)
                    return NotFound(new { message = "Feedback not found" });

                _context.UserFeedback.Remove(feedback);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Feedback deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting feedback: {ex.Message}");
                return StatusCode(500, new { message = "Error deleting feedback", error = ex.Message });
            }
        }

        // GET: api/feedback/admin/{id}
        [HttpGet("admin/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetFeedbackById(int id)
        {
            try
            {
                var feedback = await _context.UserFeedback
                    .Include(f => f.User)
                    .FirstOrDefaultAsync(f => f.Id == id);

                if (feedback == null)
                    return NotFound(new { message = "Feedback not found" });

                var response = new AdminFeedbackResponseDto
                {
                    Id = feedback.Id,
                    UserId = feedback.UserId,
                    Username = feedback.User!.Username,
                    UserEmail = feedback.User.Email,
                    FeedbackType = feedback.FeedbackType,
                    Subject = feedback.Subject,
                    Message = feedback.Message,
                    Status = feedback.Status,
                    CreatedAt = feedback.CreatedAt
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching feedback: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching feedback", error = ex.Message });
            }
        }
    }

    // Additional DTOs
    public class AdminFeedbackResponseDto
    {
        public int Id { get; set; }
        public Guid UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string FeedbackType { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateFeedbackStatusDto
    {
        public string Status { get; set; } = string.Empty; // Pending, Reviewed, Resolved
    }
}