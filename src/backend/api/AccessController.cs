using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Jeffpardy
{
    [ApiController]
    [Route("api/Access")]
    public class AccessController : Controller
    {
        private readonly string _accessCode;

        public AccessController(IConfiguration configuration)
        {
            _accessCode = configuration["AccessCode"] ?? "";
        }

        [HttpPost("Validate")]
        public IActionResult Validate([FromBody] AccessCodeRequest request)
        {
            if ((request?.Code ?? "") == _accessCode)
            {
                return Ok(new { valid = true });
            }

            return Unauthorized(new { valid = false, error = "Invalid access code" });
        }
    }

    public class AccessCodeRequest
    {
        public string Code { get; set; }
    }
}
