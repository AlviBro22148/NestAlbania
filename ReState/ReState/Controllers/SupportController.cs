using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReState.Models;
using ReState.Services;

namespace ReState.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SupportController : ControllerBase
    {
        private readonly IEmailService _emailService;
        private readonly ILogger<SupportController> _logger;

        public SupportController(
            IEmailService emailService,
            ILogger<SupportController> logger)
        {
            _emailService = emailService;
            _logger = logger;
        }

        // POST: api/support/contact
        [HttpPost("contact")]
        public async Task<IActionResult> ContactSupport([FromBody] ContactSupportDto request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Subject))
                    return BadRequest(new { message = "Subject is required" });

                if (string.IsNullOrWhiteSpace(request.Message))
                    return BadRequest(new { message = "Message is required" });

                // Send email to company support
                await _emailService.SendSupportEmailAsync(
                    request.UserEmail,
                    request.UserName,
                    request.Subject,
                    request.Message
                );

                _logger.LogInformation($"Support request received from {request.UserEmail}: {request.Subject}");

                return Ok(new { message = "Your message has been sent successfully. We'll get back to you within 24 hours." });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error processing support request: {ex.Message}");
                return StatusCode(500, new { message = "Failed to send message. Please try again later." });
            }
        }
    }
}