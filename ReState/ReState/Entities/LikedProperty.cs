namespace ReState.Entities
{
    public class LikedProperty
    {
        public int Id { get; set; }
        public Guid UserId { get; set; }
        public int PropertyId { get; set; }
        public DateTime LikedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User User { get; set; } = null!;
        public Property Property { get; set; } = null!;
    }
}
