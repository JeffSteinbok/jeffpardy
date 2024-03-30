using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Jeffpardy
{
    public class SeasonManifest
    {
        public int Season { get; set; }

        public DateTime EarliestAirDate { get; set; }

        public List<ManifestCategory> JeopardyCategories { get; set; }

        public List<ManifestCategory> DoubleJeopardyCategories { get; set; }

        public List<ManifestCategory> FinalJeopardyCategories { get; set; }
    }

    public class ManifestCategory
    {
        public string Title { get; set; }

        public DateTime AirDate { get; set; }

        public string FileName { get; set; }

        public int Index { get; set; }

        [JsonIgnore]
        public int Season { get; set; }
    }
}
