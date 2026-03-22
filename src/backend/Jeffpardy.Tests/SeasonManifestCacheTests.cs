using System;
using System.Collections.Generic;
using System.Reflection;
using Xunit;

namespace Jeffpardy.Tests
{
    public class SeasonManifestCacheTests
    {
        private SeasonManifestCache CreateInstance()
        {
            var constructor = typeof(SeasonManifestCache).GetConstructor(
                BindingFlags.NonPublic | BindingFlags.Instance,
                null, Type.EmptyTypes, null);
            return (SeasonManifestCache)constructor!.Invoke(null);
        }

        private SeasonManifest CreateSeasonManifest(
            int season = 1,
            int jeopardyCount = 1,
            int doubleJeopardyCount = 1,
            int finalJeopardyCount = 1)
        {
            var jeopardyCategories = new List<ManifestCategory>();
            for (int i = 0; i < jeopardyCount; i++)
                jeopardyCategories.Add(new ManifestCategory { Title = $"J-Cat-{i}", FileName = $"j{i}.json", Index = i });

            var doubleJeopardyCategories = new List<ManifestCategory>();
            for (int i = 0; i < doubleJeopardyCount; i++)
                doubleJeopardyCategories.Add(new ManifestCategory { Title = $"DJ-Cat-{i}", FileName = $"dj{i}.json", Index = i });

            var finalJeopardyCategories = new List<ManifestCategory>();
            for (int i = 0; i < finalJeopardyCount; i++)
                finalJeopardyCategories.Add(new ManifestCategory { Title = $"FJ-Cat-{i}", FileName = $"fj{i}.json", Index = i });

            return new SeasonManifest
            {
                Season = season,
                EarliestAirDate = new DateTime(2020 + season, 1, 1),
                JeopardyCategories = jeopardyCategories,
                DoubleJeopardyCategories = doubleJeopardyCategories,
                FinalJeopardyCategories = finalJeopardyCategories
            };
        }

        [Fact]
        public void NewInstance_HasEmptySeasonManifestList()
        {
            var cache = CreateInstance();
            Assert.Empty(cache.SeasonManifestList);
        }

        [Fact]
        public void NewInstance_HasEmptyJeopardyCategoryList()
        {
            var cache = CreateInstance();
            Assert.Empty(cache.JeopardyCategoryList);
        }

        [Fact]
        public void NewInstance_HasEmptyDoubleJeopardyCategoryList()
        {
            var cache = CreateInstance();
            Assert.Empty(cache.DoubleJeopardyCategoryList);
        }

        [Fact]
        public void NewInstance_HasEmptyFinalJeopardyCategoryList()
        {
            var cache = CreateInstance();
            Assert.Empty(cache.FinalJeopardyCategoryList);
        }

        [Fact]
        public void AddSeason_AddsSeasonToSeasonManifestList()
        {
            var cache = CreateInstance();
            var manifest = CreateSeasonManifest(season: 5);

            cache.AddSeason(manifest);

            Assert.Single(cache.SeasonManifestList);
            Assert.Equal(5, cache.SeasonManifestList[0].Season);
        }

        [Fact]
        public void AddSeason_PopulatesJeopardyCategoryList()
        {
            var cache = CreateInstance();
            var manifest = CreateSeasonManifest(jeopardyCount: 3);

            cache.AddSeason(manifest);

            Assert.Equal(3, cache.JeopardyCategoryList.Count);
            Assert.Equal("J-Cat-0", cache.JeopardyCategoryList[0].Title);
            Assert.Equal("J-Cat-1", cache.JeopardyCategoryList[1].Title);
            Assert.Equal("J-Cat-2", cache.JeopardyCategoryList[2].Title);
        }

        [Fact]
        public void AddSeason_PopulatesDoubleJeopardyCategoryList()
        {
            var cache = CreateInstance();
            var manifest = CreateSeasonManifest(doubleJeopardyCount: 2);

            cache.AddSeason(manifest);

            Assert.Equal(2, cache.DoubleJeopardyCategoryList.Count);
            Assert.Equal("DJ-Cat-0", cache.DoubleJeopardyCategoryList[0].Title);
            Assert.Equal("DJ-Cat-1", cache.DoubleJeopardyCategoryList[1].Title);
        }

        [Fact]
        public void AddSeason_PopulatesFinalJeopardyCategoryList()
        {
            var cache = CreateInstance();
            var manifest = CreateSeasonManifest(finalJeopardyCount: 2);

            cache.AddSeason(manifest);

            Assert.Equal(2, cache.FinalJeopardyCategoryList.Count);
            Assert.Equal("FJ-Cat-0", cache.FinalJeopardyCategoryList[0].Title);
        }

        [Fact]
        public void AddSeason_SetsSeasonPropertyOnJeopardyCategories()
        {
            var cache = CreateInstance();
            var manifest = CreateSeasonManifest(season: 42, jeopardyCount: 2);

            cache.AddSeason(manifest);

            foreach (var cat in cache.JeopardyCategoryList)
                Assert.Equal(42, cat.Season);
        }

        [Fact]
        public void AddSeason_SetsSeasonPropertyOnDoubleJeopardyCategories()
        {
            var cache = CreateInstance();
            var manifest = CreateSeasonManifest(season: 38, doubleJeopardyCount: 2);

            cache.AddSeason(manifest);

            foreach (var cat in cache.DoubleJeopardyCategoryList)
                Assert.Equal(38, cat.Season);
        }

        [Fact]
        public void AddSeason_SetsSeasonPropertyOnFinalJeopardyCategories()
        {
            var cache = CreateInstance();
            var manifest = CreateSeasonManifest(season: 15, finalJeopardyCount: 1);

            cache.AddSeason(manifest);

            Assert.Equal(15, cache.FinalJeopardyCategoryList[0].Season);
        }

        [Fact]
        public void AddSeason_MultipleSeasons_AccumulatesSeasonManifests()
        {
            var cache = CreateInstance();

            cache.AddSeason(CreateSeasonManifest(season: 1));
            cache.AddSeason(CreateSeasonManifest(season: 2));
            cache.AddSeason(CreateSeasonManifest(season: 3));

            Assert.Equal(3, cache.SeasonManifestList.Count);
            Assert.Equal(1, cache.SeasonManifestList[0].Season);
            Assert.Equal(2, cache.SeasonManifestList[1].Season);
            Assert.Equal(3, cache.SeasonManifestList[2].Season);
        }

        [Fact]
        public void AddSeason_MultipleSeasons_AccumulatesCategories()
        {
            var cache = CreateInstance();

            cache.AddSeason(CreateSeasonManifest(season: 1, jeopardyCount: 2, doubleJeopardyCount: 3, finalJeopardyCount: 1));
            cache.AddSeason(CreateSeasonManifest(season: 2, jeopardyCount: 1, doubleJeopardyCount: 2, finalJeopardyCount: 1));

            Assert.Equal(3, cache.JeopardyCategoryList.Count);
            Assert.Equal(5, cache.DoubleJeopardyCategoryList.Count);
            Assert.Equal(2, cache.FinalJeopardyCategoryList.Count);
        }

        [Fact]
        public void AddSeason_MultipleSeasons_EachCategoryHasCorrectSeason()
        {
            var cache = CreateInstance();

            cache.AddSeason(CreateSeasonManifest(season: 10, jeopardyCount: 1));
            cache.AddSeason(CreateSeasonManifest(season: 20, jeopardyCount: 1));

            Assert.Equal(10, cache.JeopardyCategoryList[0].Season);
            Assert.Equal(20, cache.JeopardyCategoryList[1].Season);
        }

        [Fact]
        public void StaticInstance_ReturnsNonNull()
        {
            Assert.NotNull(SeasonManifestCache.Instance);
        }

        [Fact]
        public void StaticInstance_ReturnsISeasonManifestCache()
        {
            Assert.IsAssignableFrom<ISeasonManifestCache>(SeasonManifestCache.Instance);
        }

        [Fact]
        public void StaticInstance_ReturnsSameInstanceOnMultipleCalls()
        {
            var first = SeasonManifestCache.Instance;
            var second = SeasonManifestCache.Instance;
            Assert.Same(first, second);
        }
    }
}
