using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReState.Data;
using ReState.Models;
using System.Security.Claims;

namespace ReState.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LocalServicesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public LocalServicesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/localservices
        [HttpGet]
        public async Task<IActionResult> GetAllServices(
            [FromQuery] string? category = null,
            [FromQuery] string? city = null,
            [FromQuery] double? latitude = null,
            [FromQuery] double? longitude = null,
            [FromQuery] double? radiusMiles = 10)
        {
            try
            {
                var query = _context.LocalServices.AsQueryable();

                // Filter by category
                if (!string.IsNullOrEmpty(category) && category != "All")
                {
                    query = query.Where(s => s.Category == category);
                }

                // Filter by city
                if (!string.IsNullOrEmpty(city))
                {
                    query = query.Where(s => s.City.ToLower() == city.ToLower());
                }

                var services = await query.ToListAsync();

                // Calculate distances if coordinates provided
                if (latitude.HasValue && longitude.HasValue)
                {
                    services = services.Select(s => {
                        s.Distance = CalculateDistance(latitude.Value, longitude.Value, s.Latitude, s.Longitude);
                        return s;
                    })
                    .Where(s => s.Distance <= radiusMiles.Value)
                    .OrderBy(s => s.Distance)
                    .ToList();
                }
                else
                {
                    services = services.OrderBy(s => s.Name).ToList();
                }

                return Ok(services);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching services", error = ex.Message });
            }
        }

        // GET: api/localservices/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetServiceById(int id)
        {
            try
            {
                var service = await _context.LocalServices.FindAsync(id);

                if (service == null)
                {
                    return NotFound(new { message = "Service not found" });
                }

                return Ok(service);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching service", error = ex.Message });
            }
        }

        // GET: api/localservices/categories
        [HttpGet("categories")]
        public IActionResult GetCategories()
        {
            try
            {
                var categories = new List<string>
                {
                    "Schools",
                    "Hospitals",
                    "Transportation",
                    "Shopping",
                    "Restaurants"
                };

                return Ok(categories);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching categories", error = ex.Message });
            }
        }

        // GET: api/localservices/nearby
        [HttpGet("nearby")]
        public async Task<IActionResult> GetNearbyServices(
            [FromQuery] double latitude,
            [FromQuery] double longitude,
            [FromQuery] double radiusMiles = 5,
            [FromQuery] int limit = 10)
        {
            try
            {
                var allServices = await _context.LocalServices.ToListAsync();

                var nearbyServices = allServices
                    .Select(s => {
                        s.Distance = CalculateDistance(latitude, longitude, s.Latitude, s.Longitude);
                        return s;
                    })
                    .Where(s => s.Distance <= radiusMiles)
                    .OrderBy(s => s.Distance)
                    .Take(limit)
                    .ToList();

                return Ok(nearbyServices);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching nearby services", error = ex.Message });
            }
        }

        // POST: api/localservices
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateService([FromBody] LocalService service)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                service.CreatedAt = DateTime.UtcNow;
                service.UpdatedAt = DateTime.UtcNow;

                _context.LocalServices.Add(service);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetServiceById), new { id = service.Id }, service);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating service", error = ex.Message });
            }
        }

        // PUT: api/localservices/{id}
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateService(int id, [FromBody] LocalService updatedService)
        {
            try
            {
                if (id != updatedService.Id)
                {
                    return BadRequest(new { message = "ID mismatch" });
                }

                var service = await _context.LocalServices.FindAsync(id);
                if (service == null)
                {
                    return NotFound(new { message = "Service not found" });
                }

                service.Name = updatedService.Name;
                service.Category = updatedService.Category;
                service.Address = updatedService.Address;
                service.City = updatedService.City;
                service.State = updatedService.State;
                service.ZipCode = updatedService.ZipCode;
                service.Phone = updatedService.Phone;
                service.Website = updatedService.Website;
                service.Description = updatedService.Description;
                service.Latitude = updatedService.Latitude;
                service.Longitude = updatedService.Longitude;
                service.Rating = updatedService.Rating;
                service.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(service);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating service", error = ex.Message });
            }
        }

        // DELETE: api/localservices/{id}
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteService(int id)
        {
            try
            {
                var service = await _context.LocalServices.FindAsync(id);
                if (service == null)
                {
                    return NotFound(new { message = "Service not found" });
                }

                _context.LocalServices.Remove(service);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Service deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting service", error = ex.Message });
            }
        }

        // GET: api/localservices/stats
        [HttpGet("stats")]
        public async Task<IActionResult> GetServiceStats()
        {
            try
            {
                var totalServices = await _context.LocalServices.CountAsync();

                var servicesByCategory = await _context.LocalServices
                    .GroupBy(s => s.Category)
                    .Select(g => new
                    {
                        category = g.Key,
                        count = g.Count()
                    })
                    .OrderByDescending(x => x.count)
                    .ToListAsync();

                var topRatedServices = await _context.LocalServices
                    .Where(s => s.Rating > 0)
                    .OrderByDescending(s => s.Rating)
                    .Take(5)
                    .ToListAsync();

                return Ok(new
                {
                    totalServices,
                    servicesByCategory,
                    topRatedServices
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching stats", error = ex.Message });
            }
        }

        // Helper: Calculate distance between two coordinates (Haversine formula)
        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            const double EarthRadiusMiles = 3959;

            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            var distance = EarthRadiusMiles * c;

            return Math.Round(distance, 2);
        }

        private double ToRadians(double degrees)
        {
            return degrees * (Math.PI / 180);
        }
    }
}