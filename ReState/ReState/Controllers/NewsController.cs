using CodeHollow.FeedReader;
using CodeHollow.FeedReader.Feeds;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ServiceModel.Syndication;
using System.Xml;

namespace ReState.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class NewsController : ControllerBase
    {
        private readonly ILogger<NewsController> _logger;

        // Free RSS feeds for real estate news (updated with reliable sources)
        private readonly List<string> _newsFeeds = new()
        {
            "https://www.housingwire.com/feed/",
            "https://www.globest.com/feed/",
            "https://commercialobserver.com/feed/",
            "https://therealdeal.com/feed/",
            "https://www.bisnow.com/feed/national"
        };

        private readonly HttpClient _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(5)
        };

        public NewsController(ILogger<NewsController> logger)
        {
            _logger = logger;
        }

        // GET: api/news/latest
        [HttpGet("latest")]
        public async Task<IActionResult> GetLatestNews([FromQuery] int count = 60)
        {
            try
            {
                var allNews = new List<NewsArticle>();

                // Fetch feeds in parallel with individual timeouts
                var fetchTasks = _newsFeeds.Select(feedUrl => FetchFeedWithTimeout(feedUrl, TimeSpan.FromSeconds(5)));

                try
                {
                    var results = await Task.WhenAll(fetchTasks);
                    allNews = results.SelectMany(r => r).ToList();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Some feeds failed to fetch: {ex.Message}");
                }

                // If no news fetched from feeds, add fallback articles
                if (allNews.Count == 0)
                {
                    _logger.LogInformation("No news from feeds, returning fallback news");
                    allNews = GetFallbackNews();
                }

                // Sort by date and take requested count
                var latestNews = allNews
                    .OrderByDescending(n => n.PublishedDate)
                    .Take(count)
                    .ToList();

                return Ok(latestNews);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching news: {ex.Message}");
                // Return fallback news instead of error
                return Ok(GetFallbackNews());
            }
        }

        private async Task<List<NewsArticle>> FetchFeedWithTimeout(string feedUrl, TimeSpan timeout)
        {
            try
            {
                using var cts = new CancellationTokenSource(timeout);
                var feedTask = FeedReader.ReadAsync(feedUrl);

                var completedTask = await Task.WhenAny(feedTask, Task.Delay(timeout, cts.Token));

                if (completedTask != feedTask)
                {
                    _logger.LogWarning($"Timeout fetching feed: {feedUrl}");
                    return new List<NewsArticle>();
                }

                var feed = await feedTask;
                var articles = new List<NewsArticle>();

                foreach (var item in feed.Items.Take(5))
                {
                    articles.Add(new NewsArticle
                    {
                        Title = item.Title ?? "No Title",
                        Summary = StripHtml(item.Description ?? item.Content ?? ""),
                        Link = item.Link ?? "",
                        Source = feed.Title ?? "Unknown Source",
                        PublishedDate = item.PublishingDate ?? DateTime.UtcNow,
                        ImageUrl = ExtractImageUrl(item)
                    });
                }

                _logger.LogInformation($"Fetched {articles.Count} articles from {feedUrl}");
                return articles;
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"Failed to fetch feed {feedUrl}: {ex.Message}");
                return new List<NewsArticle>();
            }
        }

        private List<NewsArticle> GetFallbackNews()
        {
            return new List<NewsArticle>
            {
                new NewsArticle
                {
                    Title = "Albania's Real Estate Market Sees Continued Growth in 2025",
                    Summary = "The Albanian property market continues to attract both domestic and international investors, with Tirana leading the charge in property appreciation and new developments.",
                    Link = "https://www.invest-in-albania.org/real-estate/",
                    Source = "R.Estate News",
                    PublishedDate = DateTime.UtcNow.AddHours(-2),
                    ImageUrl = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400"
                },
                new NewsArticle
                {
                    Title = "New Infrastructure Projects Boost Property Values Along Albanian Riviera",
                    Summary = "Government investments in roads and tourism infrastructure are driving up property prices in coastal areas, making them attractive for vacation home buyers.",
                    Link = "https://www.invest-in-albania.org/infrastructure/",
                    Source = "R.Estate News",
                    PublishedDate = DateTime.UtcNow.AddHours(-6),
                    ImageUrl = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400"
                },
                new NewsArticle
                {
                    Title = "Tips for First-Time Homebuyers in Albania: What You Need to Know",
                    Summary = "Navigating the Albanian real estate market can be challenging for newcomers. Here's a comprehensive guide to making your first property purchase.",
                    Link = "https://www.invest-in-albania.org/buying-guide/",
                    Source = "R.Estate News",
                    PublishedDate = DateTime.UtcNow.AddHours(-12),
                    ImageUrl = "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400"
                },
                new NewsArticle
                {
                    Title = "Sustainable Living: Eco-Friendly Properties Gaining Popularity",
                    Summary = "More Albanian developers are incorporating green building practices, with energy-efficient homes becoming increasingly desirable among environmentally conscious buyers.",
                    Link = "https://www.invest-in-albania.org/green-homes/",
                    Source = "R.Estate News",
                    PublishedDate = DateTime.UtcNow.AddDays(-1),
                    ImageUrl = "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400"
                },
                new NewsArticle
                {
                    Title = "Investment Opportunities: Commercial Real Estate in Tirana",
                    Summary = "The capital's commercial property sector offers attractive yields for investors, particularly in the retail and office space segments.",
                    Link = "https://www.invest-in-albania.org/commercial/",
                    Source = "R.Estate News",
                    PublishedDate = DateTime.UtcNow.AddDays(-2),
                    ImageUrl = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400"
                },
                new NewsArticle
                {
                    Title = "Understanding Albanian Property Law: A Guide for Foreign Buyers",
                    Summary = "Foreign nationals can purchase property in Albania with relatively few restrictions. Here's what international buyers need to know about the legal framework.",
                    Link = "https://www.invest-in-albania.org/legal/",
                    Source = "R.Estate News",
                    PublishedDate = DateTime.UtcNow.AddDays(-3),
                    ImageUrl = "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400"
                },
                new NewsArticle
                {
                    Title = "Rental Market Update: Best Areas for Property Investment",
                    Summary = "With tourism on the rise, rental yields in key Albanian cities and coastal towns remain attractive for buy-to-let investors.",
                    Link = "https://www.invest-in-albania.org/rentals/",
                    Source = "R.Estate News",
                    PublishedDate = DateTime.UtcNow.AddDays(-4),
                    ImageUrl = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"
                },
                new NewsArticle
                {
                    Title = "Mortgage Rates in Albania: What Homebuyers Can Expect",
                    Summary = "Albanian banks are offering competitive mortgage rates, making homeownership more accessible. Here's a breakdown of current lending options.",
                    Link = "https://www.invest-in-albania.org/mortgages/",
                    Source = "R.Estate News",
                    PublishedDate = DateTime.UtcNow.AddDays(-5),
                    ImageUrl = "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400"
                }
            };
        }

        // GET: api/news/search
        [HttpGet("search")]
        public async Task<IActionResult> SearchNews([FromQuery] string query, [FromQuery] int count = 10)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return await GetLatestNews(count);
            }

            try
            {
                // Search in fallback news first (faster response)
                var fallbackResults = GetFallbackNews()
                    .Where(n => n.Title.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                               n.Summary.Contains(query, StringComparison.OrdinalIgnoreCase))
                    .ToList();

                // Also try to fetch from feeds with timeout
                var allNews = new List<NewsArticle>(fallbackResults);

                var fetchTasks = _newsFeeds.Select(async feedUrl =>
                {
                    try
                    {
                        var articles = await FetchFeedWithTimeout(feedUrl, TimeSpan.FromSeconds(3));
                        return articles.Where(a =>
                            a.Title.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                            a.Summary.Contains(query, StringComparison.OrdinalIgnoreCase)
                        ).ToList();
                    }
                    catch
                    {
                        return new List<NewsArticle>();
                    }
                });

                try
                {
                    var results = await Task.WhenAll(fetchTasks);
                    allNews.AddRange(results.SelectMany(r => r));
                }
                catch { }

                var searchResults = allNews
                    .GroupBy(n => n.Title)
                    .Select(g => g.First())
                    .OrderByDescending(n => n.PublishedDate)
                    .Take(count)
                    .ToList();

                return Ok(searchResults);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error searching news: {ex.Message}");
                var fallbackResults = GetFallbackNews()
                    .Where(n => n.Title.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                               n.Summary.Contains(query, StringComparison.OrdinalIgnoreCase))
                    .Take(count)
                    .ToList();
                return Ok(fallbackResults);
            }
        }

        private string StripHtml(string html)
        {
            if (string.IsNullOrEmpty(html))
                return string.Empty;

            // Simple HTML stripping - for production, use HtmlAgilityPack
            var text = System.Text.RegularExpressions.Regex.Replace(html, "<.*?>", string.Empty);

            // Decode HTML entities
            text = System.Net.WebUtility.HtmlDecode(text);

            // Limit length
            if (text.Length > 300)
                text = text.Substring(0, 297) + "...";

            return text.Trim();
        }

        private string ExtractImageUrl(FeedItem item)
        {
            // Try to extract image from enclosure
            if (item.SpecificItem is MediaRssFeedItem mediaItem && mediaItem.Enclosure?.MediaType?.StartsWith("image") == true)
            {
                return mediaItem.Enclosure.Url;
            }

            // Try to extract from content
            var content = item.Content ?? item.Description ?? "";
            var imgMatch = System.Text.RegularExpressions.Regex.Match(
                content,
                @"<img[^>]+src=[""']([^""']+)[""']",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase
            );

            if (imgMatch.Success)
                return imgMatch.Groups[1].Value;

            // Default placeholder
            return "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400";
        }
    }

    public class NewsArticle
    {
        public string Title { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string Link { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public DateTime PublishedDate { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
    }
}