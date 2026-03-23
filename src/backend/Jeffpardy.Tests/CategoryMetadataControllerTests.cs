using System;
using System.Collections.Generic;
using Moq;
using Xunit;

namespace Jeffpardy.Tests
{
    public class CategoryMetadataControllerTests
    {
        private readonly Mock<ISeasonManifestCache> _mockCache;

        public CategoryMetadataControllerTests()
        {
            _mockCache = new Mock<ISeasonManifestCache>();
        }

        private CategoryMetadataController CreateController()
        {
            return new CategoryMetadataController(_mockCache.Object);
        }

        private List<ManifestCategory> CreateManifestCategories(params string[] titles)
        {
            var list = new List<ManifestCategory>();
            for (int i = 0; i < titles.Length; i++)
            {
                list.Add(new ManifestCategory
                {
                    Title = titles[i],
                    FileName = $"cat{i}.json",
                    Index = i,
                    Season = 1,
                    AirDate = new DateTime(2023, 1, 1)
                });
            }
            return list;
        }

        [Fact]
        public void Search_ReturnsMatchingCategories()
        {
            var categories = CreateManifestCategories("History", "Science", "Historical Fiction");
            _mockCache.Setup(c => c.JeopardyCategoryList).Returns(categories);

            var controller = CreateController();
            var result = controller.Search(RoundDescriptor.Jeffpardy, "Histor");

            Assert.Equal(2, result.Length);
        }

        [Fact]
        public void Search_IsCaseInsensitive()
        {
            var categories = CreateManifestCategories("Science", "SCIENCE Facts", "Other");
            _mockCache.Setup(c => c.JeopardyCategoryList).Returns(categories);

            var controller = CreateController();
            var result = controller.Search(RoundDescriptor.Jeffpardy, "science");

            Assert.Equal(2, result.Length);
        }

        [Fact]
        public void Search_ReturnsCorrectMetadata()
        {
            var categories = CreateManifestCategories("Test Category");
            _mockCache.Setup(c => c.JeopardyCategoryList).Returns(categories);

            var controller = CreateController();
            var result = controller.Search(RoundDescriptor.Jeffpardy, "Test");

            Assert.Single(result);
            Assert.Equal("Test Category", result[0].Title);
            Assert.Equal(1, result[0].Season);
            Assert.Equal("cat0.json", result[0].FileName);
            Assert.Equal(0, result[0].Index);
        }

        [Fact]
        public void Search_UsesDoubleJeopardyList_ForSuperJeffpardy()
        {
            var jeopardyCategories = CreateManifestCategories("J-Match");
            var doubleJeopardyCategories = CreateManifestCategories("DJ-Match", "DJ-Other");

            _mockCache.Setup(c => c.JeopardyCategoryList).Returns(jeopardyCategories);
            _mockCache.Setup(c => c.DoubleJeopardyCategoryList).Returns(doubleJeopardyCategories);

            var controller = CreateController();
            var result = controller.Search(RoundDescriptor.SuperJeffpardy, "DJ");

            Assert.Equal(2, result.Length);
        }

        [Fact]
        public void Search_UsesFinalJeopardyList_ForFinalJeffpardy()
        {
            var finalCategories = CreateManifestCategories("Final-Match", "Final-Other");
            _mockCache.Setup(c => c.FinalJeopardyCategoryList).Returns(finalCategories);

            var controller = CreateController();
            var result = controller.Search(RoundDescriptor.FinalJeffpardy, "Final");

            Assert.Equal(2, result.Length);
        }

        [Fact]
        public void Search_NoMatch_ReturnsEmptyArray()
        {
            var categories = CreateManifestCategories("History", "Science");
            _mockCache.Setup(c => c.JeopardyCategoryList).Returns(categories);

            var controller = CreateController();
            var result = controller.Search(RoundDescriptor.Jeffpardy, "ZZZ");

            Assert.Empty(result);
        }

        [Fact]
        public void Search_LimitsResultsTo100()
        {
            var titles = new string[150];
            for (int i = 0; i < 150; i++)
                titles[i] = $"Match-{i}";

            var categories = CreateManifestCategories(titles);
            _mockCache.Setup(c => c.JeopardyCategoryList).Returns(categories);

            var controller = CreateController();
            var result = controller.Search(RoundDescriptor.Jeffpardy, "Match");

            Assert.Equal(100, result.Length);
        }
    }
}
