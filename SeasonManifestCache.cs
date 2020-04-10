using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;

namespace Jeffpardy
{
    public class SeasonManifestCache : ISeasonManifestCache
    {
        private static readonly Lazy<SeasonManifestCache> instance = new Lazy<SeasonManifestCache>(() => new SeasonManifestCache());

        private readonly List<SeasonManifest> seasonManifestList;
        private readonly List<ManifestCategory> jeopardyCategoryList;
        private readonly List<ManifestCategory> doubleJeopardyCategoryList;

        public static ISeasonManifestCache Instance
        {
            get
            {
                return instance.Value;
            }
        }

        public IReadOnlyList<SeasonManifest> SeasonManifestList => this.seasonManifestList;

        public IReadOnlyList<ManifestCategory> JeopardyCategoryList => jeopardyCategoryList;

        public IReadOnlyList<ManifestCategory> DoubleJeopardyCategoryList => doubleJeopardyCategoryList;

        private SeasonManifestCache()
        {
            this.seasonManifestList = new List<SeasonManifest>();
            this.jeopardyCategoryList = new List<ManifestCategory>();
            this.doubleJeopardyCategoryList = new List<ManifestCategory>();
        }

        public void AddSeason(SeasonManifest seasonManifest)
        {
            this.seasonManifestList.Add(seasonManifest);
            seasonManifest.JeopardyCategories.ForEach((cat) => cat.Season = seasonManifest.Season);
            seasonManifest.DoubleJeopardyCategories.ForEach((cat) => cat.Season = seasonManifest.Season);

            this.jeopardyCategoryList.AddRange(seasonManifest.JeopardyCategories);
            this.doubleJeopardyCategoryList.AddRange(seasonManifest.DoubleJeopardyCategories);
        }
    }
}
