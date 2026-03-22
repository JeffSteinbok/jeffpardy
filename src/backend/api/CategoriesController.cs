using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace Jeffpardy
{
    [ApiController]
    [Route("api/Categories")]
    public class CategoriesController : Controller
    {
        private readonly ISeasonManifestCache _cache;
        private readonly ICategoryLoader _loader;

        Random rand = new Random();

        public CategoriesController(ISeasonManifestCache cache, ICategoryLoader loader)
        {
            _cache = cache;
            _loader = loader;
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

            int categoryIndex = rand.Next(0, categoryList.Count);

            var category = await _loader.LoadCategoryAsync(categoryList[categoryIndex]);

            return category;
        }

        [Route("{season}/{fileName}")]
        public async Task<Category> GetCategoryFromFilename(int season, string fileName)
        {
            int index = int.Parse(Request.Query["index"]);
            var category = await _loader.LoadCategoryAsync(season, fileName, index);

            return category;
        }


        private async Task<Category[]> GetCategoriesAsync(IReadOnlyList<ManifestCategory> categoryList)
        {
            int categoryCount = categoryList.Count;
            int categorySegments = categoryCount / 6;

            int startCategoryIndex = rand.Next(0, categorySegments) * 6;

            List<ManifestCategory> manifestCategories = new List<ManifestCategory>();

            for (int i = startCategoryIndex; i < startCategoryIndex + 6; i++)
            {
                manifestCategories.Add(categoryList[i]);
            }

            return await LoadCategoriesAsync(manifestCategories);
        }

        private async Task<Category[]> LoadCategoriesAsync(List<ManifestCategory> manifestCategories)
        {
            var categoryLoadTasks = manifestCategories.Select((mc) => _loader.LoadCategoryAsync(mc));

            await Task.WhenAll(categoryLoadTasks);

            return categoryLoadTasks.Select((clt) => clt.Result).ToArray();
        }

        private async Task<Category> FinalCategoryAndClueAsync(IReadOnlyList<ManifestCategory> categoryList)
        {
            int categoryIndex = rand.Next(0, categoryList.Count);

            ManifestCategory finalManifestCategory = categoryList[categoryIndex];

            var finalCategory = await _loader.LoadCategoryAsync(finalManifestCategory);

            return finalCategory;
        }

    }
}
