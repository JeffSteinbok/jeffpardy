using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Jeffpardy
{
    public class CategoryQuestion
    {
        public string Clue { get; set; }

        public string Question { get; set; }
    }

    public class Category
    {
        public string Title { get; set; }

        public string Comment { get; set; }
        public CategoryQuestion[] Clues { get; set; }
    }
}
