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
        // GET: api/categories
        [HttpGet]
        public IEnumerable<string> Get()
        {
            return CategoryCache.Instance.CategoryDictionary.Keys.Select(key => key);
        }

        [Route("[action]")]
        [HttpGet]
        public Category[] GetGameBoard(int count)
        {
            return CategoryCache.Instance.CategoryDictionary.Values.Take(6).ToArray();
        }


    }
}
