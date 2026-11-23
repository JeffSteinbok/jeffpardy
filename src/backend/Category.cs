using System;

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

        /// <summary>Season number from the manifest; used to identify the category uniquely.</summary>
        public int Season { get; set; }

        /// <summary>File name from the manifest; used to identify the category uniquely.</summary>
        public string FileName { get; set; }

        /// <summary>Index within the file from the manifest; used to identify the category uniquely.</summary>
        public int Index { get; set; }
    }

    public class CategoryKey
    {
        public int Season { get; set; }

        public string FileName { get; set; }

        public int Index { get; set; }
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
