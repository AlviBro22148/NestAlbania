using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReState.Data;
using System.Security.Claims;

namespace ReState.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MarketAnalysisController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<MarketAnalysisController> _logger;

        public MarketAnalysisController(ApplicationDbContext context, ILogger<MarketAnalysisController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/MarketAnalysis/overview
        [HttpGet("overview")]
        public async Task<IActionResult> GetMarketOverview()
        {
            try
            {
                _logger.LogInformation("Fetching market overview");

                var stats = await _context.Properties
                    .GroupBy(_ => 1)
                    .Select(g => new
                    {
                        Total = g.Count(),
                        Available = g.Count(p => p.Status == "Available"),
                        Sold = g.Count(p => p.Status == "Sold"),
                        Average = g.Average(p => p.Price),
                        Min = g.Min(p => p.Price),
                        Max = g.Max(p => p.Price)
                    })
                    .FirstOrDefaultAsync();

                if (stats == null)
                {
                    _logger.LogWarning("No properties found in database");
                    return Ok(new
                    {
                        totalProperties = 0,
                        availableProperties = 0,
                        soldProperties = 0,
                        averagePrice = 0,
                        medianPrice = 0,
                        lowestPrice = 0,
                        highestPrice = 0
                    });
                }

                _logger.LogInformation($"Market overview fetched successfully. Total properties: {stats.Total}");

                return Ok(new
                {
                    totalProperties = stats.Total,
                    availableProperties = stats.Available,
                    soldProperties = stats.Sold,
                    averagePrice = Math.Round(stats.Average, 2),
                    lowestPrice = stats.Min,
                    highestPrice = stats.Max
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching market overview");
                return StatusCode(500, new { message = "Error fetching market overview", error = ex.Message });
            }
        }

        // GET: api/MarketAnalysis/by-property-type
        [HttpGet("by-property-type")]
        public async Task<IActionResult> GetPricesByPropertyType()
        {
            try
            {
                _logger.LogInformation("Fetching prices by property type");

                var pricesByType = await _context.Properties
                    .Where(p => !string.IsNullOrEmpty(p.PropertyType))
                    .GroupBy(p => p.PropertyType)
                    .Select(g => new
                    {
                        propertyType = g.Key,
                        averagePrice = Math.Round(g.Average(p => p.Price), 2),
                        count = g.Count(),
                        minPrice = g.Min(p => p.Price),
                        maxPrice = g.Max(p => p.Price)
                    })
                    .OrderByDescending(x => x.averagePrice)
                    .ToListAsync();

                _logger.LogInformation($"Found {pricesByType.Count} property types");

                return Ok(pricesByType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching prices by type");
                return StatusCode(500, new { message = "Error fetching prices by type", error = ex.Message });
            }
        }

        // GET: api/MarketAnalysis/by-city
        [HttpGet("by-city")]
        public async Task<IActionResult> GetPricesByCity()
        {
            try
            {
                _logger.LogInformation("Fetching prices by city");

                var pricesByCity = await _context.Properties
                    .Where(p => !string.IsNullOrEmpty(p.City))
                    .GroupBy(p => p.City)
                    .Select(g => new
                    {
                        city = g.Key,
                        averagePrice = Math.Round(g.Average(p => p.Price), 2),
                        count = g.Count(),
                        minPrice = g.Min(p => p.Price),
                        maxPrice = g.Max(p => p.Price)
                    })
                    .OrderByDescending(x => x.count)
                    .Take(10)
                    .ToListAsync();

                _logger.LogInformation($"Found {pricesByCity.Count} cities");

                return Ok(pricesByCity);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching prices by city");
                return StatusCode(500, new { message = "Error fetching prices by city", error = ex.Message });
            }
        }

        // GET: api/MarketAnalysis/trends
        [HttpGet("trends")]
        public async Task<IActionResult> GetPriceTrends()
        {
            try
            {
                _logger.LogInformation("Fetching price trends");

                var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);

                var trends = await _context.Properties
                    .Where(p => p.CreatedAt >= sixMonthsAgo)
                    .GroupBy(p => new { p.CreatedAt.Year, p.CreatedAt.Month })
                    .Select(g => new
                    {
                        year = g.Key.Year,
                        month = g.Key.Month,
                        averagePrice = g.Average(p => p.Price),
                        count = g.Count()
                    })
                    .ToListAsync();

                if (!trends.Any())
                {
                    _logger.LogWarning("No recent properties found for trends");
                    return Ok(new { trends = new List<object>(), trendPercentage = (decimal?)null, trendDirection = "stable" });
                }

                var formattedTrends = trends
                    .Select(t => new
                    {
                        month = $"{t.year}-{t.month:D2}",
                        averagePrice = Math.Round(t.averagePrice, 2),
                        count = t.count
                    })
                    .OrderBy(x => x.month)
                    .ToList();

                // Calculate trend percentage
                decimal? trendPercentage = null;
                string trendDirection = "stable";

                if (trends.Count >= 2)
                {
                    var firstMonth = trends.First().averagePrice;
                    var lastMonth = trends.Last().averagePrice;

                    if (firstMonth > 0)
                    {
                        trendPercentage = Math.Round(((lastMonth - firstMonth) / firstMonth) * 100, 2);
                        trendDirection = trendPercentage > 0 ? "up" : trendPercentage < 0 ? "down" : "stable";
                    }
                }

                _logger.LogInformation($"Trends calculated. Direction: {trendDirection}");

                return Ok(new
                {
                    trends,
                    trendPercentage,
                    trendDirection
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching trends");
                return StatusCode(500, new { message = "Error fetching trends", error = ex.Message });
            }
        }

        // GET: api/MarketAnalysis/hot-locations
        [HttpGet("hot-locations")]
        public async Task<IActionResult> GetHotLocations()
        {
            try
            {
                _logger.LogInformation("Fetching hot locations");

                var oneMonthAgo = DateTime.UtcNow.AddMonths(-1);

                var hotLocations = await _context.Properties
                    .Where(p => p.CreatedAt >= oneMonthAgo && !string.IsNullOrEmpty(p.City))
                    .GroupBy(p => p.City)
                    .Select(g => new
                    {
                        city = g.Key,
                        newListings = g.Count(),
                        averagePrice = Math.Round(g.Average(p => p.Price), 2)
                    })
                    .OrderByDescending(x => x.newListings)
                    .Take(5)
                    .ToListAsync();

                _logger.LogInformation($"Found {hotLocations.Count} hot locations");

                return Ok(hotLocations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching hot locations");
                return StatusCode(500, new { message = "Error fetching hot locations", error = ex.Message });
            }
        }

        // GET: api/MarketAnalysis/forecast
        [HttpGet("forecast")]
        public async Task<IActionResult> GetForecast()
        {
            try
            {
                _logger.LogInformation("Generating forecast");

                var threeMonthsAgo = DateTime.UtcNow.AddMonths(-3);

                var recentStats = await _context.Properties
                    .Where(p => p.CreatedAt >= threeMonthsAgo)
                    .GroupBy(_ => 1)
                    .Select(g => new
                    {
                        Count = g.Count(),
                        Average = g.Average(p => p.Price)
                    })
                    .FirstOrDefaultAsync();

                if (recentStats == null || recentStats.Count < 10)
                {
                    _logger.LogWarning($"Insufficient data for forecast. Only {recentStats?.Count ?? 0} properties found");

                    var allTimeAvg = await _context.Properties.AnyAsync() ? await _context.Properties.AverageAsync(p => p.Price) : 0;

                    return Ok(new
                    {
                        forecast = "insufficient_data",
                        message = $"Not enough data for accurate forecast. Found {recentStats?.Count ?? 0} recent properties, need at least 10.",
                        currentAveragePrice = Math.Round(allTimeAvg, 2),
                        growthRate = 0m,
                        recommendation = "Insufficient data"
                    });
                }

                var recentAverage = recentStats.Average;
                var allTimeAverage = await _context.Properties.AverageAsync(p => p.Price);

                var growth = allTimeAverage > 0
                    ? ((recentAverage - allTimeAverage) / allTimeAverage) * 100
                    : 0;

                // Simple forecast: project next 3 months based on recent trend
                var forecastMonths = new List<object>();
                var currentMonth = DateTime.UtcNow;

                for (int i = 1; i <= 3; i++)
                {
                    var forecastMonth = currentMonth.AddMonths(i);
                    var projectedPrice = recentAverage * (decimal)(1 + (growth / 100 * i));

                    forecastMonths.Add(new
                    {
                        month = forecastMonth.ToString("yyyy-MM"),
                        projectedPrice = Math.Round(projectedPrice, 2)
                    });
                }

                var recommendation = growth > 5 ? "Strong buyer's market" :
                                   growth < -5 ? "Good time to buy" :
                                   "Stable market";

                _logger.LogInformation($"Forecast generated. Growth rate: {growth:F2}%, Recommendation: {recommendation}");

                return Ok(new
                {
                    currentAveragePrice = Math.Round(recentAverage, 2),
                    growthRate = Math.Round(growth, 2),
                    forecast = forecastMonths,
                    recommendation
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating forecast");
                return StatusCode(500, new { message = "Error generating forecast", error = ex.Message });
            }
        }

        // GET: api/MarketAnalysis/test
        [HttpGet("test")]
        public IActionResult Test()
        {
            _logger.LogInformation("Test endpoint called");
            return Ok(new { message = "MarketAnalysis API is working!", timestamp = DateTime.UtcNow });
        }

        // Helper: Calculate Median
        private decimal CalculateMedian(List<decimal> values)
        {
            if (values.Count == 0) return 0;

            var sorted = values.OrderBy(v => v).ToList();
            int mid = sorted.Count / 2;

            if (sorted.Count % 2 == 0)
                return (sorted[mid - 1] + sorted[mid]) / 2;
            else
                return sorted[mid];
        }
    }
}