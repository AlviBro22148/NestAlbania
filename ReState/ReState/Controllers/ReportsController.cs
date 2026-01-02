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
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ReportsController> _logger;

        public ReportsController(ApplicationDbContext context, ILogger<ReportsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/reports
        [HttpGet]
        public async Task<IActionResult> GetReports()
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var reports = await _context.Reports
                    .Where(r => r.UserId == userId)
                    .Include(r => r.ReportProperties)
                        .ThenInclude(rp => rp.Property)
                    .OrderByDescending(r => r.UpdatedAt)
                    .ToListAsync();

                var response = reports.Select(r => new ReportResponseDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    Description = r.Description,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt,
                    Properties = r.ReportProperties.Select(rp => new ReportPropertyResponseDto
                    {
                        Id = rp.Id,
                        PropertyId = rp.PropertyId,
                        Notes = rp.Notes,
                        AddedAt = rp.AddedAt,
                        Property = rp.Property != null ? new PropertySummaryDto
                        {
                            Id = rp.Property.Id,
                            Title = rp.Property.Title,
                            Address = rp.Property.Address,
                            Price = rp.Property.Price,
                            Bedrooms = rp.Property.Bedrooms,
                            Bathrooms = rp.Property.Bathrooms,
                            Area = rp.Property.Area,
                            PropertyType = rp.Property.PropertyType,
                            Status = rp.Property.Status,
                            Image = rp.Property.Images.FirstOrDefault()
                        } : null
                    }).ToList()
                });

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching reports: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching reports", error = ex.Message });
            }
        }

        // GET: api/reports/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetReport(int id)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var report = await _context.Reports
                    .Where(r => r.Id == id && r.UserId == userId)
                    .Include(r => r.ReportProperties)
                        .ThenInclude(rp => rp.Property)
                    .FirstOrDefaultAsync();

                if (report == null)
                    return NotFound(new { message = "Report not found" });

                var response = new ReportResponseDto
                {
                    Id = report.Id,
                    Name = report.Name,
                    Description = report.Description,
                    CreatedAt = report.CreatedAt,
                    UpdatedAt = report.UpdatedAt,
                    Properties = report.ReportProperties.Select(rp => new ReportPropertyResponseDto
                    {
                        Id = rp.Id,
                        PropertyId = rp.PropertyId,
                        Notes = rp.Notes,
                        AddedAt = rp.AddedAt,
                        Property = rp.Property != null ? new PropertySummaryDto
                        {
                            Id = rp.Property.Id,
                            Title = rp.Property.Title,
                            Address = rp.Property.Address,
                            Price = rp.Property.Price,
                            Bedrooms = rp.Property.Bedrooms,
                            Bathrooms = rp.Property.Bathrooms,
                            Area = rp.Property.Area,
                            PropertyType = rp.Property.PropertyType,
                            Status = rp.Property.Status,
                            Image = rp.Property.Images.FirstOrDefault()
                        } : null
                    }).ToList()
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching report: {ex.Message}");
                return StatusCode(500, new { message = "Error fetching report", error = ex.Message });
            }
        }

        // POST: api/reports
        [HttpPost]
        public async Task<IActionResult> CreateReport([FromBody] CreateReportDto dto)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                if (string.IsNullOrWhiteSpace(dto.Name))
                    return BadRequest(new { message = "Report name is required" });

                var report = new Report
                {
                    UserId = userId,
                    Name = dto.Name.Trim(),
                    Description = dto.Description?.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Reports.Add(report);
                await _context.SaveChangesAsync();

                return Ok(new ReportResponseDto
                {
                    Id = report.Id,
                    Name = report.Name,
                    Description = report.Description,
                    CreatedAt = report.CreatedAt,
                    UpdatedAt = report.UpdatedAt,
                    Properties = new List<ReportPropertyResponseDto>()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating report: {ex.Message}");
                return StatusCode(500, new { message = "Error creating report", error = ex.Message });
            }
        }

        // PUT: api/reports/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateReport(int id, [FromBody] UpdateReportDto dto)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var report = await _context.Reports
                    .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

                if (report == null)
                    return NotFound(new { message = "Report not found" });

                if (!string.IsNullOrWhiteSpace(dto.Name))
                    report.Name = dto.Name.Trim();

                if (dto.Description != null)
                    report.Description = dto.Description.Trim();

                report.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Report updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating report: {ex.Message}");
                return StatusCode(500, new { message = "Error updating report", error = ex.Message });
            }
        }

        // DELETE: api/reports/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReport(int id)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var report = await _context.Reports
                    .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

                if (report == null)
                    return NotFound(new { message = "Report not found" });

                _context.Reports.Remove(report);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Report deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting report: {ex.Message}");
                return StatusCode(500, new { message = "Error deleting report", error = ex.Message });
            }
        }

        // POST: api/reports/{id}/properties
        [HttpPost("{id}/properties")]
        public async Task<IActionResult> AddPropertyToReport(int id, [FromBody] AddPropertyToReportDto dto)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var report = await _context.Reports
                    .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

                if (report == null)
                    return NotFound(new { message = "Report not found" });

                // Check if property exists
                var property = await _context.Properties.FindAsync(dto.PropertyId);
                if (property == null)
                    return NotFound(new { message = "Property not found" });

                // Check if property already in report
                var existingEntry = await _context.ReportProperties
                    .FirstOrDefaultAsync(rp => rp.ReportId == id && rp.PropertyId == dto.PropertyId);

                if (existingEntry != null)
                    return BadRequest(new { message = "Property already in this report" });

                var reportProperty = new ReportProperty
                {
                    ReportId = id,
                    PropertyId = dto.PropertyId,
                    Notes = dto.Notes?.Trim(),
                    AddedAt = DateTime.UtcNow
                };

                _context.ReportProperties.Add(reportProperty);
                report.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Property added to report",
                    reportProperty = new ReportPropertyResponseDto
                    {
                        Id = reportProperty.Id,
                        PropertyId = reportProperty.PropertyId,
                        Notes = reportProperty.Notes,
                        AddedAt = reportProperty.AddedAt,
                        Property = new PropertySummaryDto
                        {
                            Id = property.Id,
                            Title = property.Title,
                            Address = property.Address,
                            Price = property.Price,
                            Bedrooms = property.Bedrooms,
                            Bathrooms = property.Bathrooms,
                            Area = property.Area,
                            PropertyType = property.PropertyType,
                            Status = property.Status,
                            Image = property.Images.FirstOrDefault()
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error adding property to report: {ex.Message}");
                return StatusCode(500, new { message = "Error adding property to report", error = ex.Message });
            }
        }

        // PUT: api/reports/{reportId}/properties/{propertyId}
        [HttpPut("{reportId}/properties/{propertyId}")]
        public async Task<IActionResult> UpdateReportProperty(int reportId, int propertyId, [FromBody] UpdateReportPropertyDto dto)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var report = await _context.Reports
                    .FirstOrDefaultAsync(r => r.Id == reportId && r.UserId == userId);

                if (report == null)
                    return NotFound(new { message = "Report not found" });

                var reportProperty = await _context.ReportProperties
                    .FirstOrDefaultAsync(rp => rp.ReportId == reportId && rp.PropertyId == propertyId);

                if (reportProperty == null)
                    return NotFound(new { message = "Property not found in this report" });

                reportProperty.Notes = dto.Notes?.Trim();
                report.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Report property updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating report property: {ex.Message}");
                return StatusCode(500, new { message = "Error updating report property", error = ex.Message });
            }
        }

        // DELETE: api/reports/{reportId}/properties/{propertyId}
        [HttpDelete("{reportId}/properties/{propertyId}")]
        public async Task<IActionResult> RemovePropertyFromReport(int reportId, int propertyId)
        {
            try
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out Guid userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var report = await _context.Reports
                    .FirstOrDefaultAsync(r => r.Id == reportId && r.UserId == userId);

                if (report == null)
                    return NotFound(new { message = "Report not found" });

                var reportProperty = await _context.ReportProperties
                    .FirstOrDefaultAsync(rp => rp.ReportId == reportId && rp.PropertyId == propertyId);

                if (reportProperty == null)
                    return NotFound(new { message = "Property not found in this report" });

                _context.ReportProperties.Remove(reportProperty);
                report.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Property removed from report" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error removing property from report: {ex.Message}");
                return StatusCode(500, new { message = "Error removing property from report", error = ex.Message });
            }
        }
    }
}
