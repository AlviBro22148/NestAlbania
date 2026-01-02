namespace ReState.Services
{
    public interface IEmailService
    {
        Task SendTwoFactorCodeAsync(string toEmail, string code, string username);
        Task SendSupportEmailAsync(string userEmail, string userName, string subject, string message);
    }
}