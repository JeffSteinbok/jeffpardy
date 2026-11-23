using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Jeffpardy
{
    [ApiController]
    [Route("api/Categories")]
    [ServiceFilter(typeof(AccessCodeFilter))]
    public class CategoriesController : Controller
    {
        private readonly ISeasonManifestCache _cache;
        private readonly ICategoryLoader _loader;
        private readonly IUsedCategoryTracker _usedCategoryTracker;

        Random rand = new Random();

        public CategoriesController(ISeasonManifestCache cache, ICategoryLoader loader, IUsedCategoryTracker usedCategoryTracker)
        {
            _cache = cache;
            _loader = loader;
            _usedCategoryTracker = usedCategoryTracker;
        }

        [Route("GameData")]
        [HttpGet]
        public async Task<GameData> GetGameData()
        {
            var gd = new GameData()
            {
                Rounds = new GameRound[]
                {
                    new GameRound
                    {
                        Id = 0,
                        Categories = await this.GetCategoriesAsync(_cache.JeopardyCategoryList)
                    },
                    new GameRound
                    {
                        Id = 1,
                        Categories = await this.GetCategoriesAsync(_cache.DoubleJeopardyCategoryList)
                    }
                },
                FinalJeffpardyCategory = await this.FinalCategoryAndClueAsync(_cache.FinalJeopardyCategoryList)

            };
            return gd;
        }

        [Route("RandomCategory/{roundDescriptor}")]
        public async Task<Category> GetRandomCategory(RoundDescriptor roundDescriptor)
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

            var available = await GetAvailableCategoriesAsync(categoryList, 1);
            int categoryIndex = rand.Next(0, available.Count);

            var category = await _loader.LoadCategoryAsync(available[categoryIndex]);

            return category;
        }

        [Route("{season}/{fileName}")]
        public async Task<Category> GetCategoryFromFilename(int season, string fileName)
        {
            int index = int.Parse(Request.Query["index"]);
            var category = await _loader.LoadCategoryAsync(season, fileName, index);

            return category;
        }

        [Route("RecordGameComplete")]
        [HttpPost]
        public async Task<IActionResult> RecordGameComplete([FromBody] List<CategoryKey> categories)
        {
            if (categories == null || categories.Count == 0)
            {
                return BadRequest("No categories provided.");
            }

            var keys = categories
                .Where(c => c != null && !string.IsNullOrEmpty(c.FileName))
                .Select(c => $"{c.Season}/{c.FileName}/{c.Index}")
                .ToList();

            await _usedCategoryTracker.RecordUsedCategoriesAsync(keys);

            return Ok();
        }

        private async Task<Category[]> GetCategoriesAsync(IReadOnlyList<ManifestCategory> categoryList)
        {
            var available = await GetAvailableCategoriesAsync(categoryList, 6);

            var selected = available
                .OrderBy(_ => rand.Next())
                .Take(6)
                .ToList();

            return await LoadCategoriesAsync(selected);
        }

        private async Task<List<ManifestCategory>> GetAvailableCategoriesAsync(IReadOnlyList<ManifestCategory> categoryList, int minimumRequired)
        {
            var usedKeys = await _usedCategoryTracker.GetUsedCategoryKeysAsync();

            var available = categoryList
                .Where(c => !usedKeys.Contains(c.UniqueKey))
                .ToList();

            // Fall back to full list if not enough unused categories remain
            if (available.Count < minimumRequired)
            {
                available = categoryList.ToList();
            }

            return available;
        }

        private async Task<Category[]> LoadCategoriesAsync(List<ManifestCategory> manifestCategories)
        {
            var categoryLoadTasks = manifestCategories.Select((mc) => _loader.LoadCategoryAsync(mc));

            await Task.WhenAll(categoryLoadTasks);

            return categoryLoadTasks.Select((clt) => clt.Result).ToArray();
        }

        private async Task<Category> FinalCategoryAndClueAsync(IReadOnlyList<ManifestCategory> categoryList)
        {
            var available = await GetAvailableCategoriesAsync(categoryList, 1);
            int categoryIndex = rand.Next(0, available.Count);

            ManifestCategory finalManifestCategory = available[categoryIndex];

            var finalCategory = await _loader.LoadCategoryAsync(finalManifestCategory);

            return finalCategory;
        }

    }
}
