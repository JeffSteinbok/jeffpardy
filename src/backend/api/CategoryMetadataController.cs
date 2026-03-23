using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace Jeffpardy
{
    [ApiController]
    [Route("api/CategoryMetadata")]
    public class CategoryMetadataController : Controller
    {
        private readonly ISeasonManifestCache _cache;

        public CategoryMetadataController(ISeasonManifestCache cache)
        {
            _cache = cache;
        }

        [Route("Search/{roundDescriptor}/{searchTerm}")]
        public CategoryMetadata[] Search(RoundDescriptor roundDescriptor, string searchTerm)
        {
            IReadOnlyList<ManifestCategory> categoryList = null;
            switch (roundDescriptor)
            {
                case RoundDescriptor.Jeffpardy:
                    categoryList = _cache.JeopardyCategoryList;
                    break;
                case RoundDescriptor.SuperJeffpardy:
                    categoryList = _cache.DoubleJeopardyCategoryList;
                    break;
                case RoundDescriptor.FinalJeffpardy:
                    categoryList = _cache.FinalJeopardyCategoryList;
                    break;
            }

            var searchResultCategoryMetadata = categoryList.Where(m => m.Title.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)).
                                                                    Take(100).
                                                                    Select(m => new CategoryMetadata()
                                                                    {
                                                                        AirDate = m.AirDate,
                                                                        Title = m.Title,
                                                                        Season = m.Season,
                                                                        FileName = m.FileName,
                                                                        Index = m.Index
                                                                    }).
                                                                    ToArray();

            return searchResultCategoryMetadata;
        }
    }
}
