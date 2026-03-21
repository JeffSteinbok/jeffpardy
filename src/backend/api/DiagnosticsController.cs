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
        [HttpGet]
        public JeffpardyDiagnostics GetDiagnostics()
        {
            return new JeffpardyDiagnostics();
        }

    }

    public class JeffpardyDiagnostics
    {
        public int NumJeopardyCategories
        {
            get
            {
                return SeasonManifestCache.Instance.JeopardyCategoryList.Count;
            }
        }
        
        public int NumSuperJeffpardyCategories
        {
            get
            {
                return SeasonManifestCache.Instance.DoubleJeopardyCategoryList.Count;
            }
        }

        public int NumFinalJeffpardyCategories
        {
            get
            {
                return SeasonManifestCache.Instance.FinalJeopardyCategoryList.Count;
            }
        }

        public int NumCategories
        {
            get
            {
                return SeasonManifestCache.Instance.JeopardyCategoryList.Count +
                       SeasonManifestCache.Instance.DoubleJeopardyCategoryList.Count +
                       SeasonManifestCache.Instance.FinalJeopardyCategoryList.Count;
            }
        }

        public DateTime OldestCategory
        {
            get
            {
                var allCategories = SeasonManifestCache.Instance.JeopardyCategoryList.Concat(SeasonManifestCache.Instance.DoubleJeopardyCategoryList).Concat(SeasonManifestCache.Instance.FinalJeopardyCategoryList);
                return allCategories.Min(c => c.AirDate);
            }
        }

        public DateTime NewestCategory
        {
            get
            {
                var allCategories = SeasonManifestCache.Instance.JeopardyCategoryList.Concat(SeasonManifestCache.Instance.DoubleJeopardyCategoryList).Concat(SeasonManifestCache.Instance.FinalJeopardyCategoryList);
                return allCategories.Max(c => c.AirDate);
            }
        }
    }
}
