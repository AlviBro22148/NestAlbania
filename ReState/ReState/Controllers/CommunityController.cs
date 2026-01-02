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
    public class CommunityController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CommunityController> _logger;

        public CommunityController(ApplicationDbContext context, ILogger<CommunityController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // POST: api/community/posts
        [HttpPost("posts")]
        [Authorize]
        public async Task<IActionResult> CreatePost([FromBody] CreatePostDto dto)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var post = new CommunityPost
                {
                    UserId = userId,
                    Title = dto.Title,
                    Content = dto.Content,
                    Category = dto.Category,
                    CreatedAt = DateTime.UtcNow
                };

                _context.CommunityPosts.Add(post);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Post created successfully", postId = post.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating post: {ex.Message}");
                return StatusCode(500, new { message = "Error creating post", error = ex.Message });
            }
        }

        // GET: api/community/posts
        [HttpGet("posts")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllPosts([FromQuery] string? category = null)
        {
            try
            {
                var query = _context.CommunityPosts
                    .Include(p => p.User)
                    .Include(p => p.Comments)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(category))
                {
                    query = query.Where(p => p.Category == category);
                }

                var posts = await query
                    .OrderByDescending(p => p.CreatedAt)
                    .Select(p => new PostResponseDto
                    {
                        Id = p.Id,
                        Username = p.User!.Username,
                        UserProfilePicture = p.User.ProfilePictureUrl,
                        Title = p.Title,
                        Content = p.Content,
                        Category = p.Category,
                        Likes = p.Likes,
                        CommentCount = p.Comments.Count,
                        CreatedAt = p.CreatedAt
                    })
                    .ToListAsync();

                return Ok(posts);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching posts: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching posts", error = ex.Message });
            }
        }

        // GET: api/community/posts/{id}
        [HttpGet("posts/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPostById(int id)
        {
            try
            {
                var post = await _context.CommunityPosts
                    .Include(p => p.User)
                    .Include(p => p.Comments)
                        .ThenInclude(c => c.User)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (post == null)
                    return NotFound(new { message = "Post not found" });

                var response = new
                {
                    id = post.Id,
                    username = post.User!.Username,
                    userProfilePicture = post.User.ProfilePictureUrl,
                    title = post.Title,
                    content = post.Content,
                    category = post.Category,
                    likes = post.Likes,
                    createdAt = post.CreatedAt,
                    comments = post.Comments
                        .OrderBy(c => c.CreatedAt)
                        .Select(c => new CommentResponseDto
                        {
                            Id = c.Id,
                            UserId = c.UserId, // Added for deletion check
                            Username = c.User!.Username,
                            UserProfilePicture = c.User.ProfilePictureUrl,
                            Comment = c.Comment,
                            CreatedAt = c.CreatedAt
                        }).ToList()
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching post: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching post", error = ex.Message });
            }
        }

        // POST: api/community/posts/{id}/like
        [HttpPost("posts/{id}/like")]
        [Authorize]
        public async Task<IActionResult> ToggleLike(int id)
        {
            try
            {
                _logger.LogInformation($"ToggleLike called for post {id}");

                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                _logger.LogInformation($"User ID string: {userIdString}");

                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                {
                    _logger.LogWarning("User not authenticated or invalid user ID");
                    return Unauthorized(new { message = "User not authenticated" });
                }

                _logger.LogInformation($"Parsed user ID: {userId}");

                var post = await _context.CommunityPosts.FindAsync(id);
                if (post == null)
                {
                    _logger.LogWarning($"Post {id} not found");
                    return NotFound(new { message = "Post not found" });
                }

                _logger.LogInformation($"Post found. Current likes: {post.Likes}");

                // Check if user already liked this post
                var existingLike = await _context.PostLikes
                    .FirstOrDefaultAsync(pl => pl.PostId == id && pl.UserId == userId);

                _logger.LogInformation($"Existing like found: {existingLike != null}");

                if (existingLike != null)
                {
                    _logger.LogInformation("Removing like...");
                    _context.PostLikes.Remove(existingLike);
                    post.Likes = Math.Max(0, post.Likes - 1);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Like removed successfully");

                    return Ok(new
                    {
                        message = "Post unliked",
                        likes = post.Likes,
                        isLiked = false
                    });
                }
                else
                {
                    _logger.LogInformation("Adding new like...");
                    var like = new PostLike
                    {
                        PostId = id,
                        UserId = userId,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.PostLikes.Add(like);
                    post.Likes++;

                    _logger.LogInformation("Saving changes...");
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Like added successfully");

                    return Ok(new
                    {
                        message = "Post liked",
                        likes = post.Likes,
                        isLiked = true
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error toggling like: {ex.Message}");
                _logger.LogError($"Stack trace: {ex.StackTrace}");
                _logger.LogError($"Inner exception: {ex.InnerException?.Message}");
                return StatusCode(500, new { message = "Error toggling like", error = ex.Message });
            }
        }

        // GET: api/community/posts/{id}/is-liked - FIXED ROUTE
        [HttpGet("posts/{id}/is-liked")]
        [Authorize]
        public async Task<IActionResult> IsPostLiked(int id)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                // Check if post exists
                var postExists = await _context.CommunityPosts.AnyAsync(p => p.Id == id);
                if (!postExists)
                    return NotFound(new { message = "Post not found" });

                var isLiked = await _context.PostLikes
                    .AnyAsync(pl => pl.PostId == id && pl.UserId == userId);

                return Ok(new { isLiked });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error checking like status: {ex.Message}");
                return StatusCode(500, new { message = "Error checking like status", error = ex.Message });
            }
        }

        // POST: api/community/comments
        [HttpPost("comments")]
        [Authorize]
        public async Task<IActionResult> AddComment([FromBody] CreateCommentDto dto)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var post = await _context.CommunityPosts.FindAsync(dto.PostId);
                if (post == null)
                    return NotFound(new { message = "Post not found" });

                var comment = new PostComment
                {
                    PostId = dto.PostId,
                    UserId = userId,
                    Comment = dto.Comment,
                    CreatedAt = DateTime.UtcNow
                };

                _context.PostComments.Add(comment);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Comment added successfully", commentId = comment.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error adding comment: {ex.Message}");
                return StatusCode(500, new { message = "Error adding comment", error = ex.Message });
            }
        }

        // DELETE: api/community/comments/{id} - NEW ENDPOINT
        [HttpDelete("comments/{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteComment(int id)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var comment = await _context.PostComments.FindAsync(id);
                if (comment == null)
                    return NotFound(new { message = "Comment not found" });

                // Check if user owns the comment or is admin
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                if (comment.UserId != userId && userRole != "Admin")
                    return Forbid("You can only delete your own comments");

                _context.PostComments.Remove(comment);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Comment deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting comment: {ex.Message}");
                return StatusCode(500, new { message = "Error deleting comment", error = ex.Message });
            }
        }


        // DELETE: api/community/posts/{id}
        [HttpDelete("posts/{id}")]
        [Authorize]
        public async Task<IActionResult> DeletePost(int id)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var post = await _context.CommunityPosts
                    .Include(p => p.Comments)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (post == null)
                    return NotFound(new { message = "Post not found" });

                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                if (post.UserId != userId && userRole != "Admin")
                    return Forbid("You can only delete your own posts");

                _context.CommunityPosts.Remove(post);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Post deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting post: {ex.Message}");
                return StatusCode(500, new { message = "Error deleting post", error = ex.Message });
            }
        }

        // GET: api/community/my-posts
        [HttpGet("my-posts")]
        [Authorize]
        public async Task<IActionResult> GetMyPosts()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var posts = await _context.CommunityPosts
                    .Include(p => p.User)
                    .Include(p => p.Comments)
                    .Where(p => p.UserId == userId)
                    .OrderByDescending(p => p.CreatedAt)
                    .Select(p => new PostResponseDto
                    {
                        Id = p.Id,
                        Username = p.User!.Username,
                        UserProfilePicture = p.User.ProfilePictureUrl,
                        Title = p.Title,
                        Content = p.Content,
                        Category = p.Category,
                        Likes = p.Likes,
                        CommentCount = p.Comments.Count,
                        CreatedAt = p.CreatedAt
                    })
                    .ToListAsync();

                return Ok(posts);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching user posts: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching posts", error = ex.Message });
            }
        }
    }
}