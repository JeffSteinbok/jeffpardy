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
        public Category[] GetGameBoard(int count)
        {
            int categoryCount = SeasonManifestCache.Instance.JeopardyCategoryList.Count;
            int startCategoryIndex = rand.Next(0, categoryCount - 6);
            List<Category> categories = new List<Category>();

            for (int i = startCategoryIndex; i < startCategoryIndex + 6; i++)
            {
                Category cat = AzureFilesCategoryLoader.Instance.LoadCategory(SeasonManifestCache.Instance.JeopardyCategoryList[i]);
                categories.Add(cat);
            }
            return categories.ToArray();
        }


    }
}
