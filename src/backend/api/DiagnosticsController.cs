using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.CodeAnalysis;

namespace Jeffpardy
{
    [ApiController]
    [Route("api/Diagnostics")]
    public class DiagnosticsController : Controller
    {
        private readonly ISeasonManifestCache _cache;

        public DiagnosticsController(ISeasonManifestCache cache)
        {
            _cache = cache;
        }

        [HttpGet]
        public JeffpardyDiagnostics GetDiagnostics()
        {
            return new JeffpardyDiagnostics(_cache);
        }

    }

    public class JeffpardyDiagnostics
    {
        private readonly ISeasonManifestCache _cache;

        public JeffpardyDiagnostics()
        {
        }

        public JeffpardyDiagnostics(ISeasonManifestCache cache)
        {
            _cache = cache;
        }

        public int NumJeopardyCategories
        {
            get
            {
                return _cache.JeopardyCategoryList.Count;
            }
        }
        
        public int NumSuperJeffpardyCategories
        {
            get
            {
                return _cache.DoubleJeopardyCategoryList.Count;
            }
        }

        public int NumFinalJeffpardyCategories
        {
            get
            {
                return _cache.FinalJeopardyCategoryList.Count;
            }
        }

        public int NumCategories
        {
            get
            {
                return _cache.JeopardyCategoryList.Count +
                       _cache.DoubleJeopardyCategoryList.Count +
                       _cache.FinalJeopardyCategoryList.Count;
            }
        }

        public DateTime OldestCategory
        {
            get
            {
                var allCategories = _cache.JeopardyCategoryList.Concat(_cache.DoubleJeopardyCategoryList).Concat(_cache.FinalJeopardyCategoryList);
                return allCategories.Min(c => c.AirDate);
            }
        }

        public DateTime NewestCategory
        {
            get
            {
                var allCategories = _cache.JeopardyCategoryList.Concat(_cache.DoubleJeopardyCategoryList).Concat(_cache.FinalJeopardyCategoryList);
                return allCategories.Max(c => c.AirDate);
            }
        }
    }
}
