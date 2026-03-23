using System;
using Microsoft.AspNetCore.Mvc;

namespace Jeffpardy
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly ISeasonManifestCache _cache;

        public HealthController(ISeasonManifestCache cache)
        {
            _cache = cache;
        }

        [HttpGet]
        public IActionResult GetHealth()
        {
            var health = new HealthStatus(_cache);

            if (!health.CategoriesLoaded)
            {
                return StatusCode(503, health);
            }

            return Ok(health);
        }
    }

    public class HealthStatus
    {
        private readonly ISeasonManifestCache _cache;

        public HealthStatus(ISeasonManifestCache cache)
        {
            _cache = cache;
        }

        public string Status => CategoriesLoaded ? "Healthy" : "Degraded";

        public bool CategoriesLoaded => TotalCategories > 0;

        public int TotalCategories =>
            (_cache?.JeopardyCategoryList?.Count ?? 0) +
            (_cache?.DoubleJeopardyCategoryList?.Count ?? 0) +
            (_cache?.FinalJeopardyCategoryList?.Count ?? 0);

        public int JeffpardyCategories => _cache?.JeopardyCategoryList?.Count ?? 0;

        public int SuperJeffpardyCategories => _cache?.DoubleJeopardyCategoryList?.Count ?? 0;

        public int FinalJeffpardyCategories => _cache?.FinalJeopardyCategoryList?.Count ?? 0;

        public DateTime Timestamp => DateTime.UtcNow;
    }
}
