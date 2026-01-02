namespace ReState.Models
{
    public class NotificationPreferenceDto
    {
        public bool PriceChangeAlerts { get; set; }
        public bool StatusChangeAlerts { get; set; }
        public bool NewPropertyAlerts { get; set; }
        public decimal? MaxPrice { get; set; }
        public int? MinBedrooms { get; set; }
        public string? PreferredCity { get; set; }
    }
}