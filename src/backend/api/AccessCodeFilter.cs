using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;

namespace Jeffpardy
{
    /// <summary>
    /// Action filter that validates the X-Access-Code header against the configured AccessCode.
    /// If no AccessCode is configured, empty string is the valid code.
    /// </summary>
    public class AccessCodeFilter : IActionFilter
    {
        private readonly string _accessCode;

        public AccessCodeFilter(IConfiguration configuration)
        {
            _accessCode = configuration["AccessCode"] ?? "";
        }

        public void OnActionExecuting(ActionExecutingContext context)
        {
            var request = context.HttpContext.Request;

            // Check header first, then query string
            var headerValues = request.Headers["X-Access-Code"];
            var providedCode = headerValues.Count > 0
                ? (string)headerValues[0]
                : request.Query.ContainsKey("accessCode")
                    ? (string)request.Query["accessCode"]
                    : null;

            if (providedCode == null)
            {
                context.Result = new UnauthorizedObjectResult(new { error = "Missing access code" });
                return;
            }

            if (providedCode != _accessCode)
            {
                context.Result = new UnauthorizedObjectResult(new { error = "Invalid access code" });
            }
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
        }
    }
}
