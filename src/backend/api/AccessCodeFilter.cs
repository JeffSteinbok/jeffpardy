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
            var providedCode = context.HttpContext.Request.Headers["X-Access-Code"].FirstOrDefault() ?? "";

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
