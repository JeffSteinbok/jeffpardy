using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace Jeffpardy
{
    public enum RoundDescriptor
    {
        Jeffpardy,
        SuperJeffpardy,
        FinalJeffpardy
    }

    [ApiController]
    [Route("api/Categories")]
    public class CategoriesController : Controller
    {
        Random rand = new Random();

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
                        Categories = await this.GetCategoriesAsync(SeasonManifestCache.Instance.JeopardyCategoryList)
                    },
                    new GameRound
                    {
                        Id = 1,
                        Categories = await this.GetCategoriesAsync(SeasonManifestCache.Instance.DoubleJeopardyCategoryList)
                    }
                },
                FinalJeffpardyCategory = await this.FinalCategoryAndClueAsync(SeasonManifestCache.Instance.FinalJeopardyCategoryList)

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
                    categoryList = SeasonManifestCache.Instance.JeopardyCategoryList;
                    break;
                case RoundDescriptor.SuperJeffpardy:
                    categoryList = SeasonManifestCache.Instance.DoubleJeopardyCategoryList;
                    break;
                case RoundDescriptor.FinalJeffpardy:
                    categoryList = SeasonManifestCache.Instance.FinalJeopardyCategoryList;
                    break;
            }

            int categoryIndex = rand.Next(0, categoryList.Count);

            var category = await AzureBlobCategoryLoader.Instance.LoadCategoryAsync(categoryList[categoryIndex]);

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

            var categoryLoadTasks = manifestCategories.Select((mc) => AzureBlobCategoryLoader.Instance.LoadCategoryAsync(mc));

            await Task.WhenAll(categoryLoadTasks);

            return categoryLoadTasks.Select((clt) => clt.Result).ToArray();
        }

        private async Task<Category> FinalCategoryAndClueAsync(IReadOnlyList<ManifestCategory> categoryList)
        {
            int categoryIndex = rand.Next(0, categoryList.Count);

            ManifestCategory finalManifestCategory = categoryList[categoryIndex];

            var finalCategory = await AzureBlobCategoryLoader.Instance.LoadCategoryAsync(finalManifestCategory);

            return finalCategory;
        }

    }
}
