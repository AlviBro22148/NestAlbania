using Microsoft.EntityFrameworkCore;
using ReState.Entities;
using ReState.Models;
using YourNamespace.Models;

namespace ReState.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Userss { get; set; }
        public DbSet<Property> Properties { get; set; }
        public DbSet<LikedProperty> LikedProperties { get; set; }
        public DbSet<BlogArticle> BlogArticles { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<UserFeedback> UserFeedback { get; set; }
        public DbSet<CommunityPost> CommunityPosts { get; set; }
        public DbSet<PostComment> PostComments { get; set; }
        public DbSet<PostLike> PostLikes { get; set; }
        public DbSet<LocalService> LocalServices { get; set; }
        public DbSet<Testimonial> Testimonials { get; set; }
        public DbSet<TestimonialLike> TestimonialLikes { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<NotificationPreference> NotificationPreferences { get; set; }
        public DbSet<PropertyPriceHistory> PropertyPriceHistories { get; set; }
        public DbSet<AgentRequest> AgentRequests { get; set; }
        public DbSet<Report> Reports { get; set; }
        public DbSet<ReportProperty> ReportProperties { get; set; }
        public DbSet<ChatConversation> ChatConversations { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<UserPreference> UserPreferences { get; set; }
        public DbSet<PushToken> PushTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1:N --> Liked Property and user
            modelBuilder.Entity<LikedProperty>()
                .HasOne(lp => lp.User)
                .WithMany()
                .HasForeignKey(lp => lp.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LikedProperty>()
                .HasOne(lp => lp.Property)
                .WithMany()
                .HasForeignKey(lp => lp.PropertyId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LikedProperty>()
                .HasIndex(lp => new { lp.UserId, lp.PropertyId })
                .IsUnique();

            modelBuilder.Entity<Review>()
             .HasOne(r => r.Property)
             .WithMany()
             .HasForeignKey(r => r.PropertyId)
             .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Review>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PostComment>()
                .HasOne(c => c.Post)
                .WithMany(p => p.Comments)
                .HasForeignKey(c => c.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PostLike>()
                .HasIndex(pl => new { pl.PostId, pl.UserId })
                .IsUnique();

            // PostLike configuration 
            modelBuilder.Entity<PostLike>(entity =>
            {
                entity.HasKey(pl => pl.Id);

                // Relationship with CommunityPost
                entity.HasOne(pl => pl.Post)
                    .WithMany()
                    .HasForeignKey(pl => pl.PostId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Relationship with User
                entity.HasOne(pl => pl.User)
                    .WithMany()
                    .HasForeignKey(pl => pl.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Unique index to prevent duplicate likes
                entity.HasIndex(pl => new { pl.PostId, pl.UserId })
                    .IsUnique();
            });

            // TestimonialLike configuration
            modelBuilder.Entity<TestimonialLike>()
                .HasOne(tl => tl.Testimonial)
                .WithMany()
                .HasForeignKey(tl => tl.TestimonialId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TestimonialLike>()
                .HasOne(tl => tl.User)
                .WithMany()
                .HasForeignKey(tl => tl.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TestimonialLike>()
                .HasIndex(tl => new { tl.TestimonialId, tl.UserId })
                .IsUnique();

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Property)
                .WithMany()
                .HasForeignKey(n => n.PropertyId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<NotificationPreference>()
                .HasOne(np => np.User)
                .WithMany()
                .HasForeignKey(np => np.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PropertyPriceHistory>()
                .HasOne(pph => pph.Property)
                .WithMany()
                .HasForeignKey(pph => pph.PropertyId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Notification>()
                .HasIndex(n => new { n.UserId, n.IsRead });



            // AgentRequest configuration
            modelBuilder.Entity<AgentRequest>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Status)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(e => e.Username)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Email)
                    .IsRequired()
                    .HasMaxLength(255);

                entity.Property(e => e.PhoneNumber)
                    .HasMaxLength(50);

                entity.Property(e => e.RejectionReason)
                    .HasMaxLength(500);

                entity.Property(e => e.RequestedAt)
                    .IsRequired();

                // Relationships
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Reviewer)
                    .WithMany()
                    .HasForeignKey(e => e.ReviewedBy)
                    .OnDelete(DeleteBehavior.SetNull);

                // Indexes for better query performance
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.RequestedAt);
            });

            // Report configuration
            modelBuilder.Entity<Report>(entity =>
            {
                entity.HasOne(r => r.User)
                    .WithMany()
                    .HasForeignKey(r => r.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(r => r.UserId);
            });

            // ReportProperty configuration
            modelBuilder.Entity<ReportProperty>(entity =>
            {
                entity.HasOne(rp => rp.Report)
                    .WithMany(r => r.ReportProperties)
                    .HasForeignKey(rp => rp.ReportId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(rp => rp.Property)
                    .WithMany()
                    .HasForeignKey(rp => rp.PropertyId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Prevent duplicate properties in same report
                entity.HasIndex(rp => new { rp.ReportId, rp.PropertyId })
                    .IsUnique();
            });

            // ChatConversation configuration
            modelBuilder.Entity<ChatConversation>(entity =>
            {
                entity.HasOne(c => c.Property)
                    .WithMany()
                    .HasForeignKey(c => c.PropertyId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(c => c.User)
                    .WithMany()
                    .HasForeignKey(c => c.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(c => c.Agent)
                    .WithMany()
                    .HasForeignKey(c => c.AgentId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Prevent duplicate conversations for same user-agent-property combo
                entity.HasIndex(c => new { c.UserId, c.AgentId, c.PropertyId })
                    .IsUnique();

                entity.HasIndex(c => c.UserId);
                entity.HasIndex(c => c.AgentId);
            });

            // ChatMessage configuration
            modelBuilder.Entity<ChatMessage>(entity =>
            {
                entity.HasOne(m => m.Conversation)
                    .WithMany(c => c.Messages)
                    .HasForeignKey(m => m.ConversationId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(m => m.Sender)
                    .WithMany()
                    .HasForeignKey(m => m.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(m => m.ConversationId);
                entity.HasIndex(m => new { m.ConversationId, m.IsRead });
            });

            // UserPreference configuration - One-to-One with User
            modelBuilder.Entity<UserPreference>(entity =>
            {
                entity.HasOne(up => up.User)
                    .WithOne(u => u.Preference)
                    .HasForeignKey<UserPreference>(up => up.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(up => up.UserId)
                    .IsUnique();
            });
        }

        public static void SeedLocalServices(ApplicationDbContext context)
        {
            if (!context.LocalServices.Any())
            {
                var services = new List<LocalService>
                {
                    // Schools
                    new LocalService
                    {
                        Name = "Lincoln High School",
                        Category = "Schools",
                        Address = "123 Education St",
                        City = "San Francisco",
                        State = "CA",
                        ZipCode = "94102",
                        Phone = "(415) 555-0100",
                        Website = "https://lincolnhs.edu",
                        Description = "Public high school offering comprehensive education programs",
                        Latitude = 37.7749,
                        Longitude = -122.4194,
                        Rating = 4.5
                    },
                    new LocalService
                    {
                        Name = "Sunshine Elementary",
                        Category = "Schools",
                        Address = "456 Learning Ave",
                        City = "San Francisco",
                        State = "CA",
                        ZipCode = "94103",
                        Phone = "(415) 555-0101",
                        Website = "https://sunshineelem.edu",
                        Description = "Elementary school focused on innovative learning",
                        Latitude = 37.7849,
                        Longitude = -122.4094,
                        Rating = 4.7
                    },
                    
                    // Hospitals
                    new LocalService
                    {
                        Name = "City General Hospital",
                        Category = "Hospitals",
                        Address = "789 Medical Center Dr",
                        City = "San Francisco",
                        State = "CA",
                        ZipCode = "94104",
                        Phone = "(415) 555-0200",
                        Website = "https://citygeneralhospital.com",
                        Description = "Full-service hospital with emergency care and specialist departments",
                        Latitude = 37.7949,
                        Longitude = -122.3994,
                        Rating = 4.3
                    },
                    new LocalService
                    {
                        Name = "Bay Area Medical Center",
                        Category = "Hospitals",
                        Address = "321 Healthcare Blvd",
                        City = "San Francisco",
                        State = "CA",
                        ZipCode = "94105",
                        Phone = "(415) 555-0201",
                        Website = "https://bayareamedical.com",
                        Description = "Advanced medical facility with cutting-edge technology",
                        Latitude = 37.7649,
                        Longitude = -122.4294,
                        Rating = 4.6
                    },
                    
                    // Transportation
                    new LocalService
                    {
                        Name = "Downtown Transit Hub",
                        Category = "Transportation",
                        Address = "100 Transit Plaza",
                        City = "San Francisco",
                        State = "CA",
                        ZipCode = "94106",
                        Phone = "(415) 555-0300",
                        Website = "https://sfmta.com",
                        Description = "Major public transportation hub with bus and metro connections",
                        Latitude = 37.7549,
                        Longitude = -122.4394,
                        Rating = 4.1
                    },
                    new LocalService
                    {
                        Name = "BART Station - Market St",
                        Category = "Transportation",
                        Address = "Market St & 5th Ave",
                        City = "San Francisco",
                        State = "CA",
                        ZipCode = "94107",
                        Phone = "(415) 555-0301",
                        Website = "https://bart.gov",
                        Description = "Bay Area Rapid Transit station serving multiple lines",
                        Latitude = 37.7449,
                        Longitude = -122.4494,
                        Rating = 4.0
                    },
                    
                    // Shopping
                    new LocalService
                    {
                        Name = "Westfield Shopping Center",
                        Category = "Shopping",
                        Address = "865 Market St",
                        City = "San Francisco",
                        State = "CA",
                        ZipCode = "94108",
                        Phone = "(415) 555-0400",
                        Website = "https://westfield.com/sanfrancisco",
                        Description = "Premier shopping destination with over 170 stores",
                        Latitude = 37.7849,
                        Longitude = -122.4394,
                        Rating = 4.4
                    },
                    new LocalService
                    {
                        Name = "Union Square Marketplace",
                        Category = "Shopping",
                        Address = "333 Post St",
                        City = "San Francisco",
                        State = "CA",
                        ZipCode = "94109",
                        Phone = "(415) 555-0401",
                        Website = "https://unionsquaresf.com",
                        Description = "Historic shopping district with luxury brands and local boutiques",
                        Latitude = 37.7879,
                        Longitude = -122.4074,
                        Rating = 4.5
                    },
                    
                    // Restaurants
                    new LocalService
                    {
                        Name = "Golden Gate Bistro",
                        Category = "Restaurants",
                        Address = "555 California St",
                        City = "San Francisco",
                        State = "CA",
                        ZipCode = "94110",
                        Phone = "(415) 555-0500",
                        Website = "https://goldengatebristo.com",
                        Description = "Fine dining with stunning bay views and seasonal menu",
                        Latitude = 37.7929,
                        Longitude = -122.4014,
                        Rating = 4.8
                    },
                    new LocalService
                    {
                        Name = "Fisherman's Catch",
                        Category = "Restaurants",
                        Address = "Pier 39, Fisherman's Wharf",
                        City = "San Francisco",
                        State = "CA",
                        ZipCode = "94111",
                        Phone = "(415) 555-0501",
                        Website = "https://fishermanscatch.com",
                        Description = "Fresh seafood restaurant at the iconic waterfront location",
                        Latitude = 37.8087,
                        Longitude = -122.4098,
                        Rating = 4.6
                    }
                };

                context.LocalServices.AddRange(services);
                context.SaveChanges();
            }
        }
    }
}