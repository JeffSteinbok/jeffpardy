using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Jeopardy
{
    public class CategoryCache
    {
        private static readonly Lazy<CategoryCache> instance = new Lazy<CategoryCache>(() => new CategoryCache());

        public IDictionary<string, Category> CategoryDictionary
        {
            get;
            private set;
        }

        public static CategoryCache Instance
        {
            get
            {
                return instance.Value;
            }
        }

        private CategoryCache()
        {
            this.CategoryDictionary = Directory.EnumerateFiles(@"GameContent\Categories").
                Select((fileName) => this.categoryFromFile(fileName)).
                ToDictionary(obj => obj.Title);
        }

        private Category categoryFromFile(string fileName)
        {
            // read JSON directly from a file
            using (StreamReader file = File.OpenText(fileName))
            {
                JsonSerializer serializer = new JsonSerializer();
                Category category = (Category)serializer.Deserialize(file, typeof(Category));
                return category;
            }
        }
    }
}
