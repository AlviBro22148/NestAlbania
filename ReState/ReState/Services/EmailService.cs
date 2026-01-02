using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using ReState.Models;

namespace ReState.Services
{
    public class EmailService : IEmailService
    {
        private readonly SmtpSettings _smtpSettings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<SmtpSettings> smtpSettings, ILogger<EmailService> logger)
        {
            _smtpSettings = smtpSettings.Value;
            _logger = logger;
        }

        public async Task SendTwoFactorCodeAsync(string toEmail, string code, string username)
        {
            var mailMessage = new MimeMessage();
            mailMessage.From.Add(new MailboxAddress(_smtpSettings.FromName, _smtpSettings.FromEmail));
            mailMessage.To.Add(new MailboxAddress(username, toEmail));
            mailMessage.Subject = "Your Two-Factor Authentication Code";

            var builder = new BodyBuilder
            {
                HtmlBody = $@"
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                        <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;'>
                            <h1 style='color: white; margin: 0;'>ReState</h1>
                        </div>
                        
                        <div style='background-color: #f7f7f7; padding: 30px;'>
                            <div style='background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>
                                <h2 style='color: #333; margin-top: 0;'>Two-Factor Authentication</h2>
                                <p style='color: #666; line-height: 1.6;'>Hello {username},</p>
                                <p style='color: #666; line-height: 1.6;'>Your verification code is:</p>
                                
                                <div style='background-color: #667eea; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 10px; margin: 30px 0; letter-spacing: 8px;'>
                                    {code}
                                </div>
                                
                                <p style='color: #666; line-height: 1.6;'>This code will expire in 10 minutes.</p>
                                <p style='color: #999; font-size: 12px; margin-top: 30px;'>If you didn't request this code, please ignore this email.</p>
                            </div>
                        </div>
                        
                        <div style='text-align: center; padding: 20px; color: #999; font-size: 12px;'>
                            <p>© 2024 ReState. All rights reserved.</p>
                        </div>
                    </div>"
            };

            mailMessage.Body = builder.ToMessageBody();

            using var client = new MailKit.Net.Smtp.SmtpClient();

            try
            {
                await client.ConnectAsync(_smtpSettings.SmtpHost, _smtpSettings.Port, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(_smtpSettings.SmtpUsername, _smtpSettings.SmtpPassword);
                await client.SendAsync(mailMessage);
                await client.DisconnectAsync(true);

                _logger.LogInformation($"2FA code sent successfully to {toEmail}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to send 2FA code: {ex.Message}");
                throw;
            }
        }

        public async Task SendSupportEmailAsync(string userEmail, string userName, string subject, string message)
        {
            var mailMessage = new MimeMessage();
            mailMessage.From.Add(new MailboxAddress(_smtpSettings.FromName, _smtpSettings.FromEmail));
            mailMessage.To.Add(new MailboxAddress("ReState Team", "alvibro22@gmail.com"));
            mailMessage.Subject = $"[Support Request] {subject}";
            mailMessage.ReplyTo.Add(new MailboxAddress(userName, userEmail));

            var builder = new BodyBuilder
            {
                HtmlBody = $@"
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                        <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;'>
                            <h1 style='color: white; margin: 0;'>Support Request</h1>
                        </div>
                        
                        <div style='background-color: #f7f7f7; padding: 30px;'>
                            <div style='background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>
                                <h2 style='color: #333; margin-top: 0;'>New Support Request</h2>
                                
                                <div style='margin: 20px 0;'>
                                    <p style='margin: 5px 0;'><strong>From:</strong> {userName}</p>
                                    <p style='margin: 5px 0;'><strong>Email:</strong> {userEmail}</p>
                                    <p style='margin: 5px 0;'><strong>Subject:</strong> {subject}</p>
                                </div>
                                
                                <div style='background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;'>
                                    <h3 style='margin-top: 0; color: #555;'>Message:</h3>
                                    <p style='color: #666; line-height: 1.6; white-space: pre-wrap;'>{message}</p>
                                </div>
                                
                                <p style='color: #999; font-size: 12px; margin-top: 30px;'>
                                    Reply to: {userEmail}
                                </p>
                            </div>
                        </div>
                        
                        <div style='text-align: center; padding: 20px; color: #999; font-size: 12px;'>
                            <p>This is an automated message from ReState Help Center</p>
                        </div>
                    </div>"
            };

            mailMessage.Body = builder.ToMessageBody();

            using var client = new MailKit.Net.Smtp.SmtpClient();

            try
            {
                await client.ConnectAsync(_smtpSettings.SmtpHost, _smtpSettings.Port, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(_smtpSettings.SmtpUsername, _smtpSettings.SmtpPassword);
                await client.SendAsync(mailMessage);
                await client.DisconnectAsync(true);

                _logger.LogInformation($"Support email sent successfully to alvibro22@gmail.com from {userEmail}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to send support email: {ex.Message}");
                throw;
            }
        }
    }
}