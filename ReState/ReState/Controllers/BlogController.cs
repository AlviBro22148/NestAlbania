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
    public class BlogController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BlogController> _logger;
        private readonly ICloudinaryService _cloudinaryService;

        public BlogController(
            ApplicationDbContext context,
            ILogger<BlogController> logger,
            ICloudinaryService cloudinaryService)
        {
            _context = context;
            _logger = logger;
            _cloudinaryService = cloudinaryService;
        }

        // GET: api/blog
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllArticles([FromQuery] BlogFilterDto filter)
        {
            try
            {
                var query = _context.BlogArticles
                    .Include(b => b.Author)
                    .Where(b => b.IsPublished)
                    .AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(filter.Category))
                    query = query.Where(b => b.Category == filter.Category);

                if (!string.IsNullOrEmpty(filter.SearchTerm))
                    query = query.Where(b => b.Title.Contains(filter.SearchTerm) ||
                                           b.Content.Contains(filter.SearchTerm) ||
                                           b.Summary.Contains(filter.SearchTerm));

                if (!string.IsNullOrEmpty(filter.Tag))
                    query = query.Where(b => b.Tags.Contains(filter.Tag));

                if (filter.IsFeatured.HasValue)
                    query = query.Where(b => b.IsFeatured == filter.IsFeatured.Value);

                var totalArticles = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalArticles / (double)filter.PageSize);

                var articles = await query
                    .OrderByDescending(b => b.CreatedAt)
                    .Skip((filter.Page - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .Select(b => new BlogArticleResponseDto
                    {
                        Id = b.Id,
                        Title = b.Title,
                        Content = b.Content,
                        Summary = b.Summary,
                        Category = b.Category,
                        ImageUrl = b.ImageUrl,
                        Tags = b.Tags,
                        ViewCount = b.ViewCount,
                        ReadTimeMinutes = b.ReadTimeMinutes,
                        IsFeatured = b.IsFeatured,
                        AuthorName = b.Author != null ? b.Author.Username : "Admin",
                        CreatedAt = b.CreatedAt,
                        UpdatedAt = b.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(new
                {
                    articles,
                    currentPage = filter.Page,
                    pageSize = filter.PageSize,
                    totalPages,
                    totalArticles
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving articles: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving articles" });
            }
        }

        // GET: api/blog/{id}
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetArticleById(int id)
        {
            try
            {
                var article = await _context.BlogArticles
                    .Include(b => b.Author)
                    .FirstOrDefaultAsync(b => b.Id == id && b.IsPublished);

                if (article == null)
                    return NotFound(new { message = "Article not found" });

                // Increment view count
                article.ViewCount++;
                await _context.SaveChangesAsync();

                var response = new BlogArticleResponseDto
                {
                    Id = article.Id,
                    Title = article.Title,
                    Content = article.Content,
                    Summary = article.Summary,
                    Category = article.Category,
                    ImageUrl = article.ImageUrl,
                    Tags = article.Tags,
                    ViewCount = article.ViewCount,
                    ReadTimeMinutes = article.ReadTimeMinutes,
                    IsFeatured = article.IsFeatured,
                    AuthorName = article.Author?.Username ?? "Admin",
                    CreatedAt = article.CreatedAt,
                    UpdatedAt = article.UpdatedAt
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving article: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving article" });
            }
        }

        // GET: api/blog/featured
        [HttpGet("featured")]
        [AllowAnonymous]
        public async Task<IActionResult> GetFeaturedArticles()
        {
            try
            {
                var articles = await _context.BlogArticles
                    .Include(b => b.Author)
                    .Where(b => b.IsPublished && b.IsFeatured)
                    .OrderByDescending(b => b.CreatedAt)
                    .Take(5)
                    .Select(b => new BlogArticleResponseDto
                    {
                        Id = b.Id,
                        Title = b.Title,
                        Summary = b.Summary,
                        Category = b.Category,
                        ImageUrl = b.ImageUrl,
                        Tags = b.Tags,
                        ViewCount = b.ViewCount,
                        ReadTimeMinutes = b.ReadTimeMinutes,
                        IsFeatured = b.IsFeatured,
                        AuthorName = b.Author != null ? b.Author.Username : "Admin",
                        CreatedAt = b.CreatedAt
                    })
                    .ToListAsync();

                return Ok(articles);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving featured articles: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving featured articles" });
            }
        }

        // GET: api/blog/categories
        [HttpGet("categories")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                var categories = await _context.BlogArticles
                    .Where(b => b.IsPublished)
                    .Select(b => b.Category)
                    .Distinct()
                    .ToListAsync();

                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving categories: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving categories" });
            }
        }

        // GET: api/blog/popular
        [HttpGet("popular")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPopularArticles()
        {
            try
            {
                var articles = await _context.BlogArticles
                    .Include(b => b.Author)
                    .Where(b => b.IsPublished)
                    .OrderByDescending(b => b.ViewCount)
                    .Take(5)
                    .Select(b => new BlogArticleResponseDto
                    {
                        Id = b.Id,
                        Title = b.Title,
                        Summary = b.Summary,
                        Category = b.Category,
                        ImageUrl = b.ImageUrl,
                        ViewCount = b.ViewCount,
                        ReadTimeMinutes = b.ReadTimeMinutes,
                        AuthorName = b.Author != null ? b.Author.Username : "Admin",
                        CreatedAt = b.CreatedAt
                    })
                    .ToListAsync();

                return Ok(articles);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving popular articles: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving popular articles" });
            }
        }

        // POST: api/blog (Admin only) - WITH IMAGE UPLOAD
        [HttpPost]
        [Authorize(Roles = "Admin")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateArticle([FromForm] BlogArticleCreateDto dto)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                // Validate image
                if (dto.Image == null || dto.Image.Length == 0)
                    return BadRequest(new { message = "Image is required" });

                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                var extension = Path.GetExtension(dto.Image.FileName).ToLowerInvariant();

                if (!allowedExtensions.Contains(extension))
                    return BadRequest(new { message = "Invalid image format. Allowed: jpg, jpeg, png, webp" });

                if (dto.Image.Length > 5 * 1024 * 1024) // 5MB limit
                    return BadRequest(new { message = "Image size exceeds 5MB limit" });

                // Upload image to Cloudinary
                var imageUrl = await _cloudinaryService.UploadImageAsync(dto.Image, "restate/blog");

                // Parse tags from comma-separated string
                var tags = string.IsNullOrEmpty(dto.Tags)
                    ? new List<string>()
                    : dto.Tags.Split(',').Select(t => t.Trim()).Where(t => !string.IsNullOrEmpty(t)).ToList();

                var article = new BlogArticle
                {
                    Title = dto.Title,
                    Content = dto.Content,
                    Summary = dto.Summary,
                    Category = dto.Category,
                    ImageUrl = imageUrl,
                    Tags = tags,
                    ReadTimeMinutes = dto.ReadTimeMinutes,
                    IsFeatured = dto.IsFeatured,
                    IsPublished = dto.IsPublished,
                    AuthorId = userId
                };

                _context.BlogArticles.Add(article);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetArticleById), new { id = article.Id }, new
                {
                    message = "Article created successfully",
                    article = new BlogArticleResponseDto
                    {
                        Id = article.Id,
                        Title = article.Title,
                        Content = article.Content,
                        Summary = article.Summary,
                        Category = article.Category,
                        ImageUrl = article.ImageUrl,
                        Tags = article.Tags,
                        ViewCount = article.ViewCount,
                        ReadTimeMinutes = article.ReadTimeMinutes,
                        IsFeatured = article.IsFeatured,
                        CreatedAt = article.CreatedAt,
                        UpdatedAt = article.UpdatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating article: {ex.Message}");
                return StatusCode(500, new { message = "Error creating article", error = ex.Message });
            }
        }

        // PUT: api/blog/{id} (Admin only) - WITH IMAGE UPLOAD
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateArticle(int id, [FromForm] BlogArticleUpdateDto dto)
        {
            try
            {
                var article = await _context.BlogArticles.FindAsync(id);
                if (article == null)
                    return NotFound(new { message = "Article not found" });

                // Update basic fields
                article.Title = dto.Title;
                article.Content = dto.Content;
                article.Summary = dto.Summary;
                article.Category = dto.Category;
                article.ReadTimeMinutes = dto.ReadTimeMinutes;
                article.IsFeatured = dto.IsFeatured;
                article.IsPublished = dto.IsPublished;
                article.UpdatedAt = DateTime.UtcNow;

                // Parse tags
                article.Tags = string.IsNullOrEmpty(dto.Tags)
                    ? new List<string>()
                    : dto.Tags.Split(',').Select(t => t.Trim()).Where(t => !string.IsNullOrEmpty(t)).ToList();

                // Handle image update if new image provided
                if (dto.Image != null && dto.Image.Length > 0)
                {
                    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                    var extension = Path.GetExtension(dto.Image.FileName).ToLowerInvariant();

                    if (!allowedExtensions.Contains(extension))
                        return BadRequest(new { message = "Invalid image format. Allowed: jpg, jpeg, png, webp" });

                    if (dto.Image.Length > 5 * 1024 * 1024)
                        return BadRequest(new { message = "Image size exceeds 5MB limit" });

                    // Delete old image from Cloudinary if it exists
                    if (!string.IsNullOrEmpty(article.ImageUrl) && article.ImageUrl.Contains("cloudinary"))
                    {
                        try
                        {
                            var uri = new Uri(article.ImageUrl);
                            var segments = uri.Segments;
                            var publicId = string.Join("", segments.Skip(segments.Length - 2))
                                .Replace("/", "")
                                .Split('.')[0];
                            await _cloudinaryService.DeleteImageAsync($"restate/blog/{publicId}");
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning($"Failed to delete old image: {ex.Message}");
                        }
                    }

                    // Upload new image
                    article.ImageUrl = await _cloudinaryService.UploadImageAsync(dto.Image, "restate/blog");
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "Article updated successfully", imageUrl = article.ImageUrl });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating article: {ex.Message}");
                return StatusCode(500, new { message = "Error updating article", error = ex.Message });
            }
        }

        // GET: api/blog/posts (Admin only) - Get ALL articles including unpublished
        [HttpGet("posts")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllArticlesAdmin()
        {
            try
            {
                var articles = await _context.BlogArticles
                    .Include(b => b.Author)
                    .OrderByDescending(b => b.CreatedAt)
                    .Select(b => new BlogArticleResponseDto
                    {
                        Id = b.Id,
                        Title = b.Title,
                        Content = b.Content,
                        Summary = b.Summary,
                        Category = b.Category,
                        ImageUrl = b.ImageUrl,
                        Tags = b.Tags,
                        ViewCount = b.ViewCount,
                        ReadTimeMinutes = b.ReadTimeMinutes,
                        IsFeatured = b.IsFeatured,
                        AuthorName = b.Author != null ? b.Author.Username : "Admin",
                        CreatedAt = b.CreatedAt,
                        UpdatedAt = b.UpdatedAt
                    })
                    .ToListAsync();

                // Add IsPublished to the response
                var articlesWithPublished = await _context.BlogArticles
                    .OrderByDescending(b => b.CreatedAt)
                    .Select(b => new
                    {
                        b.Id,
                        b.Title,
                        b.Content,
                        b.Summary,
                        b.Category,
                        b.ImageUrl,
                        b.Tags,
                        b.ViewCount,
                        b.ReadTimeMinutes,
                        b.IsFeatured,
                        b.IsPublished,
                        AuthorName = b.Author != null ? b.Author.Username : "Admin",
                        b.CreatedAt,
                        b.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(articlesWithPublished);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving articles for admin: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving articles" });
            }
        }

        // POST: api/blog/posts (Admin only) - WITH JSON AND IMAGE URL (for admin dashboard)
        [HttpPost("posts")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateArticleWithUrl([FromBody] BlogArticleCreateWithUrlDto dto)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                if (string.IsNullOrEmpty(dto.Title) || string.IsNullOrEmpty(dto.Content))
                    return BadRequest(new { message = "Title and content are required" });

                var article = new BlogArticle
                {
                    Title = dto.Title,
                    Content = dto.Content,
                    Summary = dto.Summary ?? dto.Content.Substring(0, Math.Min(200, dto.Content.Length)),
                    Category = dto.Category ?? "tips",
                    ImageUrl = dto.ImageUrl ?? "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400",
                    Tags = dto.Tags ?? new List<string>(),
                    ReadTimeMinutes = dto.ReadTimeMinutes > 0 ? dto.ReadTimeMinutes : 5,
                    IsFeatured = dto.IsFeatured,
                    IsPublished = dto.IsPublished,
                    AuthorId = userId
                };

                _context.BlogArticles.Add(article);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetArticleById), new { id = article.Id }, new BlogArticleResponseDto
                {
                    Id = article.Id,
                    Title = article.Title,
                    Content = article.Content,
                    Summary = article.Summary,
                    Category = article.Category,
                    ImageUrl = article.ImageUrl,
                    Tags = article.Tags,
                    ViewCount = 0,
                    ReadTimeMinutes = article.ReadTimeMinutes,
                    IsFeatured = article.IsFeatured,
                    AuthorName = "Admin",
                    CreatedAt = article.CreatedAt,
                    UpdatedAt = article.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating article: {ex.Message}");
                return StatusCode(500, new { message = "Error creating article", error = ex.Message });
            }
        }

        // PUT: api/blog/posts/{id} (Admin only) - WITH JSON AND IMAGE URL (for admin dashboard)
        [HttpPut("posts/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateArticleWithUrl(int id, [FromBody] BlogArticleUpdateWithUrlDto dto)
        {
            try
            {
                var article = await _context.BlogArticles.FindAsync(id);
                if (article == null)
                    return NotFound(new { message = "Article not found" });

                article.Title = dto.Title;
                article.Content = dto.Content;
                article.Summary = dto.Summary ?? dto.Content.Substring(0, Math.Min(200, dto.Content.Length));
                article.Category = dto.Category ?? article.Category;
                article.ReadTimeMinutes = dto.ReadTimeMinutes > 0 ? dto.ReadTimeMinutes : article.ReadTimeMinutes;
                article.IsFeatured = dto.IsFeatured;
                article.IsPublished = dto.IsPublished;
                article.Tags = dto.Tags ?? article.Tags;
                article.UpdatedAt = DateTime.UtcNow;

                if (!string.IsNullOrEmpty(dto.ImageUrl))
                {
                    article.ImageUrl = dto.ImageUrl;
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "Article updated successfully", article = new BlogArticleResponseDto
                {
                    Id = article.Id,
                    Title = article.Title,
                    Content = article.Content,
                    Summary = article.Summary,
                    Category = article.Category,
                    ImageUrl = article.ImageUrl,
                    Tags = article.Tags,
                    ViewCount = article.ViewCount,
                    ReadTimeMinutes = article.ReadTimeMinutes,
                    IsFeatured = article.IsFeatured,
                    CreatedAt = article.CreatedAt,
                    UpdatedAt = article.UpdatedAt
                }});
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating article: {ex.Message}");
                return StatusCode(500, new { message = "Error updating article", error = ex.Message });
            }
        }

        // DELETE: api/blog/posts/{id} (Admin only) - Alternative endpoint for admin dashboard
        [HttpDelete("posts/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteArticleAlt(int id)
        {
            return await DeleteArticle(id);
        }

        // DELETE: api/blog/{id} (Admin only)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]

        public async Task<IActionResult> DeleteArticle(int id)
        {
            try
            {
                var article = await _context.BlogArticles.FindAsync(id);
                if (article == null)
                    return NotFound(new { message = "Article not found" });

                // Delete image from Cloudinary
                if (!string.IsNullOrEmpty(article.ImageUrl) && article.ImageUrl.Contains("cloudinary"))
                {
                    try
                    {
                        var uri = new Uri(article.ImageUrl);
                        var segments = uri.Segments;
                        var publicId = string.Join("", segments.Skip(segments.Length - 2))
                            .Replace("/", "")
                            .Split('.')[0];
                        await _cloudinaryService.DeleteImageAsync($"restate/blog/{publicId}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning($"Failed to delete image: {ex.Message}");
                    }
                }

                _context.BlogArticles.Remove(article);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Article deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting article: {ex.Message}");
                return StatusCode(500, new { message = "Error deleting article" });
            }
        }
    }
}
