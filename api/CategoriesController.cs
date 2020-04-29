using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Jeffpardy
{
    [ApiController]
    [Route("api/Categories")]
    public class CategoriesController : Controller
    {
        Random rand = new Random();

        [Route("[action]")]
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

        private async Task<Category[]> GetCategoriesAsync(IReadOnlyList<ManifestCategory> categoryList)
        {
            int categoryCount = categoryList.Count;
            int startCategoryIndex = rand.Next(0, categoryCount - 6);

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
