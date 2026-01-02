using Microsoft.EntityFrameworkCore;
using ReState.Data;
using ReState.Entities;

public static class BlogSeeder
{
    public static async Task SeedBlogData(ApplicationDbContext context)
    {
        if (await context.BlogArticles.AnyAsync())
            return; // Database already seeded

        // Find an admin user to be the author
        var adminUser = await context.Userss.FirstOrDefaultAsync(u => u.Role == "Admin");
        if (adminUser == null)
        {
            Console.WriteLine("No admin user found. Please create an admin first.");
            return;
        }

        var articles = new List<BlogArticle>
        {
            new BlogArticle
            {
                Title = "10 Tips for First-Time Home Buyers in 2024",
                Summary = "Essential advice for navigating the home buying process as a first-time buyer, from securing financing to closing the deal.",
                Content = @"Buying your first home is an exciting milestone, but it can also be overwhelming. Here are 10 essential tips to help you navigate the process:

1. **Check Your Credit Score**: Before you start house hunting, review your credit report and score. A higher credit score can help you qualify for better mortgage rates.

2. **Save for a Down Payment**: While some loans require as little as 3% down, saving 20% can help you avoid private mortgage insurance (PMI).

3. **Get Pre-Approved**: A pre-approval letter shows sellers you're a serious buyer and gives you a clear budget.

4. **Consider All Costs**: Beyond the mortgage, budget for property taxes, insurance, maintenance, and utilities.

5. **Research Neighborhoods**: Visit potential areas at different times of day to get a feel for the community.

6. **Don't Skip the Home Inspection**: This can reveal potential issues that could cost you thousands down the line.

7. **Work with a Real Estate Agent**: An experienced agent can guide you through the process and negotiate on your behalf.

8. **Be Patient**: Don't rush into a decision. The right home is worth waiting for.

9. **Understand Your Mortgage Options**: From fixed-rate to adjustable-rate mortgages, know what works best for your situation.

10. **Plan for the Future**: Consider your 5-10 year plans. Will this home still meet your needs?",
                Category = "First-Time Buyers",
                ImageUrl = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800",
                Tags = new List<string> { "buyers-guide", "tips", "mortgage", "financing" },
                ReadTimeMinutes = 8,
                IsFeatured = true,
                IsPublished = true,
                AuthorId = adminUser.Id,
                ViewCount = 1523,
                CreatedAt = DateTime.UtcNow.AddDays(-15)
            },
            new BlogArticle
            {
                Title = "Real Estate Market Trends: What to Expect in 2025",
                Summary = "An in-depth analysis of current market conditions and predictions for the upcoming year in residential real estate.",
                Content = @"The real estate market continues to evolve, and understanding current trends is crucial for both buyers and sellers. Here's what we're seeing heading into 2025:

**Interest Rate Outlook**: After several years of volatility, interest rates are expected to stabilize in the 6-7% range. This creates a more predictable environment for buyers.

**Inventory Levels**: Housing inventory is slowly increasing as more sellers list their properties. This shift from a seller's market to a more balanced market gives buyers more negotiating power.

**Remote Work Impact**: The sustained popularity of remote work continues to drive demand in suburban and rural areas, while some urban markets are seeing renewed interest as companies implement hybrid policies.

**Sustainable Housing**: Energy-efficient homes and green building practices are becoming increasingly important to buyers, often commanding premium prices.

**Technology Integration**: Smart home features are no longer luxury additions but expected amenities, particularly for younger buyers.

**Market Predictions**:
- Home prices expected to grow 3-5% nationally
- Continued strong demand in secondary markets
- Increased focus on multi-generational living spaces
- Growing interest in new construction

For buyers, this means more choices and better negotiating leverage. For sellers, proper pricing and home presentation remain critical.",
                Category = "Market Trends",
                ImageUrl = "https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=800",
                Tags = new List<string> { "market-analysis", "trends", "predictions", "2025" },
                ReadTimeMinutes = 10,
                IsFeatured = true,
                IsPublished = true,
                AuthorId = adminUser.Id,
                ViewCount = 2341,
                CreatedAt = DateTime.UtcNow.AddDays(-5)
            },
            new BlogArticle
            {
                Title = "How to Stage Your Home for a Quick Sale",
                Summary = "Professional staging tips to help your property stand out and sell faster in today's competitive market.",
                Content = @"Home staging can be the difference between a property that sits on the market and one that sells quickly for top dollar. Here's how to stage your home effectively:

**Declutter and Depersonalize**: Remove personal photos, collections, and excess furniture. Buyers need to envision themselves in the space.

**Deep Clean Everything**: A spotless home signals that the property has been well-maintained. Don't forget windows, baseboards, and grout.

**Neutralize Color Schemes**: Fresh paint in neutral tones (grays, beiges, whites) appeals to the widest audience.

**Maximize Natural Light**: Open curtains, clean windows, and ensure all light fixtures have working bulbs.

**Focus on Key Rooms**:
- **Living Room**: Arrange furniture to showcase the room's size and flow
- **Kitchen**: Clear countertops, update hardware if needed, add fresh flowers
- **Master Bedroom**: Invest in quality bedding, create a hotel-like atmosphere
- **Bathrooms**: New towels, remove toiletries, add spa-like touches

**Curb Appeal Matters**: First impressions start at the street. Maintain the lawn, add potted plants, and ensure the entrance is welcoming.

**Professional Photography**: Once staged, hire a professional photographer. Quality listing photos are essential in today's digital-first market.

**Consider Virtual Staging**: For vacant homes, virtual staging can be cost-effective while showing the property's potential.

Remember, the goal is to help buyers emotionally connect with the space while highlighting its best features.",
                Category = "Selling Tips",
                ImageUrl = "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800",
                Tags = new List<string> { "staging", "selling", "home-improvement", "tips" },
                ReadTimeMinutes = 7,
                IsFeatured = true,
                IsPublished = true,
                AuthorId = adminUser.Id,
                ViewCount = 1876,
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            },
            new BlogArticle
            {
                Title = "Understanding Property Investment: ROI and Cash Flow",
                Summary = "A comprehensive guide to evaluating investment properties, calculating returns, and building long-term wealth through real estate.",
                Content = @"Real estate investment can be a powerful wealth-building tool, but success requires understanding key financial metrics.

**Return on Investment (ROI)**: ROI measures the profitability of your investment relative to its cost.

Formula: ROI = (Annual Rental Income - Annual Expenses) / Total Investment × 100

**Cash Flow Analysis**: Positive cash flow means rental income exceeds all expenses (mortgage, taxes, insurance, maintenance).

**Key Metrics to Track**:

1. **Cap Rate**: Net Operating Income / Property Value
   - 8-12% is generally considered good for residential
   
2. **Cash-on-Cash Return**: Annual cash flow / Total cash invested
   - Measures return on actual money invested

3. **Gross Rent Multiplier**: Property price / Gross annual rent
   - Lower numbers indicate better value

**Investment Strategies**:

**Buy and Hold**: Purchase properties for long-term appreciation and rental income
- Pros: Steady income, tax benefits, appreciation
- Cons: Property management, tenant issues

**House Flipping**: Buy, renovate, and sell quickly
- Pros: Faster returns, no landlord responsibilities
- Cons: Higher risk, market dependent

**BRRRR Method**: Buy, Rehab, Rent, Refinance, Repeat
- Pros: Scalable, leverage-friendly
- Cons: Requires significant capital and expertise

**Tax Benefits**: Real estate offers numerous tax advantages including depreciation, mortgage interest deductions, and 1031 exchanges.

**Risk Management**: Diversify across properties and locations, maintain adequate reserves, and thoroughly vet tenants.

Remember: Real estate investment requires patience, capital, and active management. Start small, learn continuously, and scale strategically.",
                Category = "Investment Tips",
                ImageUrl = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800",
                Tags = new List<string> { "investment", "ROI", "cash-flow", "strategy" },
                ReadTimeMinutes = 12,
                IsFeatured = false,
                IsPublished = true,
                AuthorId = adminUser.Id,
                ViewCount = 987,
                CreatedAt = DateTime.UtcNow.AddDays(-20)
            },
            new BlogArticle
            {
                Title = "The Ultimate Home Inspection Checklist",
                Summary = "What to look for during a home inspection and how to interpret the results to make an informed buying decision.",
                Content = @"A thorough home inspection is one of the most important steps in the home buying process. Here's what inspectors check and what you should know:

**Structural Components**:
- Foundation cracks or settling
- Roof condition and estimated remaining life
- Wall and ceiling integrity
- Drainage and grading issues

**Exterior**:
- Siding condition
- Window and door seals
- Gutters and downspouts
- Deck or patio safety

**Systems**:
- **HVAC**: Age, function, and maintenance history
- **Electrical**: Panel capacity, wiring condition, GFCI outlets
- **Plumbing**: Water pressure, drain function, water heater age
- **Insulation**: Adequate coverage in attic and walls

**Interior**:
- Flooring condition
- Wall and ceiling damage
- Window operation
- Door alignment

**Safety Concerns**:
- Smoke and carbon monoxide detectors
- Handrail security
- Stairway condition
- Fire hazards

**Common Red Flags**:
- Foundation issues (can cost $10,000+)
- Roof problems (replacement: $10,000-30,000)
- Mold or water damage
- Outdated electrical systems
- Major plumbing issues

**What to Do After Inspection**:
1. Review the report thoroughly with your agent
2. Request repairs for major issues
3. Negotiate price reduction for known problems
4. Walk away if issues are too significant
5. Get specialist inspections if needed (structural engineer, pest control)

**Pro Tips**:
- Attend the inspection if possible
- Take photos of major issues
- Ask questions - inspectors are there to educate
- Keep the report for future reference
- Budget for repairs, even on 'move-in ready' homes

Remember, no home is perfect. The goal is to identify major issues that affect safety, value, or habitability.",
                Category = "Buying Guide",
                ImageUrl = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800",
                Tags = new List<string> { "inspection", "buying", "checklist", "safety" },
                ReadTimeMinutes = 9,
                IsFeatured = false,
                IsPublished = true,
                AuthorId = adminUser.Id,
                ViewCount = 1234,
                CreatedAt = DateTime.UtcNow.AddDays(-8)
            }
        };

        await context.BlogArticles.AddRangeAsync(articles);
        await context.SaveChangesAsync();

        Console.WriteLine($"Successfully seeded {articles.Count} blog articles.");
    }
}
