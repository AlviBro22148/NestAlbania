namespace ReState.Models
{
    public class SmtpSettings
    {
        public string SmtpHost { get; set; } = string.Empty;
        public string SmtpPort { get; set; } = string.Empty;
        public string SmtpUsername { get; set; } = string.Empty;
        public string SmtpPassword { get; set; } = string.Empty;
        public string FromEmail { get; set; } = string.Empty;
        public string FromName { get; set; } = string.Empty;

        public int Port => int.TryParse(SmtpPort, out var port) ? port : 587;
    }
}