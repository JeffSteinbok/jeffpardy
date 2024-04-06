using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Jeffpardy
{
    public class CategoryClue
    {
        public string Clue { get; set; }

        public string Question { get; set; }
    }

    public class Category
    {
        public string Title { get; set; }

        public DateTime AirDate { get; set; }

        public string Comment { get; set; }

        public CategoryClue[] Clues { get; set; }
    }

    public class CategoryMetadata
    {
        public string Title { get; set; }

        public DateTime AirDate { get; set; }

        public int Season { get; set; }

        public string FileName { get; set; }

        public int Index { get; set; }
    }
}
