using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace Jeffpardy.Tests
{
    public class CategoriesControllerTests
    {
        private readonly Mock<ISeasonManifestCache> _mockCache;
        private readonly Mock<ICategoryLoader> _mockLoader;
        private readonly Mock<IUsedCategoryTracker> _mockUsedCategoryTracker;

        public CategoriesControllerTests()
        {
            _mockCache = new Mock<ISeasonManifestCache>();
            _mockLoader = new Mock<ICategoryLoader>();
            _mockUsedCategoryTracker = new Mock<IUsedCategoryTracker>();

            // Default: no used categories
            _mockUsedCategoryTracker
                .Setup(t => t.GetUsedCategoryKeysAsync())
                .ReturnsAsync(new HashSet<string>() as IReadOnlySet<string>);
        }

        private CategoriesController CreateController()
        {
            return new CategoriesController(_mockCache.Object, _mockLoader.Object, _mockUsedCategoryTracker.Object);
        }

        private List<ManifestCategory> CreateManifestCategories(int count, string prefix = "Cat")
        {
            var list = new List<ManifestCategory>();
            for (int i = 0; i < count; i++)
            {
                list.Add(new ManifestCategory
                {
                    Title = $"{prefix}-{i}",
                    FileName = $"{prefix.ToLower()}{i}.json",
                    Index = i,
                    Season = 1,
                    AirDate = new DateTime(2023, 1, 1)
                });
            }
            return list;
        }

        [Fact]
        public async Task GetGameData_ReturnsTwoRoundsAndFinalCategory()
        {
            var jeopardyCategories = CreateManifestCategories(6, "J");
            var doubleJeopardyCategories = CreateManifestCategories(6, "DJ");
            var finalCategories = CreateManifestCategories(1, "FJ");

            _mockCache.Setup(c => c.JeopardyCategoryList).Returns(jeopardyCategories);
            _mockCache.Setup(c => c.DoubleJeopardyCategoryList).Returns(doubleJeopardyCategories);
            _mockCache.Setup(c => c.FinalJeopardyCategoryList).Returns(finalCategories);

            _mockLoader.Setup(l => l.LoadCategoryAsync(It.IsAny<ManifestCategory>()))
                .ReturnsAsync(new Category { Title = "Test Category" });

            var controller = CreateController();
            var result = await controller.GetGameData();

            Assert.NotNull(result);
            Assert.Equal(2, result.Rounds.Length);
            Assert.Equal(0, result.Rounds[0].Id);
            Assert.Equal(1, result.Rounds[1].Id);
            Assert.NotNull(result.FinalJeffpardyCategory);
        }

        [Fact]
        public async Task GetGameData_LoadsSixCategoriesPerRound()
        {
            var jeopardyCategories = CreateManifestCategories(6, "J");
            var doubleJeopardyCategories = CreateManifestCategories(6, "DJ");
            var finalCategories = CreateManifestCategories(1, "FJ");

            _mockCache.Setup(c => c.JeopardyCategoryList).Returns(jeopardyCategories);
            _mockCache.Setup(c => c.DoubleJeopardyCategoryList).Returns(doubleJeopardyCategories);
            _mockCache.Setup(c => c.FinalJeopardyCategoryList).Returns(finalCategories);

            _mockLoader.Setup(l => l.LoadCategoryAsync(It.IsAny<ManifestCategory>()))
                .ReturnsAsync(new Category { Title = "Test" });

            var controller = CreateController();
            var result = await controller.GetGameData();

            Assert.Equal(6, result.Rounds[0].Categories.Length);
            Assert.Equal(6, result.Rounds[1].Categories.Length);
        }

        [Theory]
        [InlineData(RoundDescriptor.Jeffpardy)]
        [InlineData(RoundDescriptor.SuperJeffpardy)]
        [InlineData(RoundDescriptor.FinalJeffpardy)]
        public async Task GetRandomCategory_ReturnsCategory(RoundDescriptor roundDescriptor)
        {
            var categories = CreateManifestCategories(3, "Cat");
            _mockCache.Setup(c => c.JeopardyCategoryList).Returns(categories);
            _mockCache.Setup(c => c.DoubleJeopardyCategoryList).Returns(categories);
            _mockCache.Setup(c => c.FinalJeopardyCategoryList).Returns(categories);

            var expectedCategory = new Category { Title = "Expected" };
            _mockLoader.Setup(l => l.LoadCategoryAsync(It.IsAny<ManifestCategory>()))
                .ReturnsAsync(expectedCategory);

            var controller = CreateController();
            var result = await controller.GetRandomCategory(roundDescriptor);

            Assert.Equal("Expected", result.Title);
        }

        [Fact]
        public async Task GetRandomCategory_UsesJeopardyCategoryList_ForJeffpardy()
        {
            var jeopardyCategories = CreateManifestCategories(1, "J");
            var otherCategories = CreateManifestCategories(1, "Other");

            _mockCache.Setup(c => c.JeopardyCategoryList).Returns(jeopardyCategories);
            _mockCache.Setup(c => c.DoubleJeopardyCategoryList).Returns(otherCategories);
            _mockCache.Setup(c => c.FinalJeopardyCategoryList).Returns(otherCategories);

            _mockLoader.Setup(l => l.LoadCategoryAsync(It.IsAny<ManifestCategory>()))
                .ReturnsAsync(new Category { Title = "Loaded" });

            var controller = CreateController();
            await controller.GetRandomCategory(RoundDescriptor.Jeffpardy);

            _mockLoader.Verify(l => l.LoadCategoryAsync(
                It.Is<ManifestCategory>(mc => mc.Title == "J-0")), Times.Once);
        }

        [Fact]
        public async Task GetRandomCategory_UsesDoubleJeopardyCategoryList_ForSuperJeffpardy()
        {
            var otherCategories = CreateManifestCategories(1, "Other");
            var doubleCategories = CreateManifestCategories(1, "DJ");

            _mockCache.Setup(c => c.JeopardyCategoryList).Returns(otherCategories);
            _mockCache.Setup(c => c.DoubleJeopardyCategoryList).Returns(doubleCategories);
            _mockCache.Setup(c => c.FinalJeopardyCategoryList).Returns(otherCategories);

            _mockLoader.Setup(l => l.LoadCategoryAsync(It.IsAny<ManifestCategory>()))
                .ReturnsAsync(new Category { Title = "Loaded" });

            var controller = CreateController();
            await controller.GetRandomCategory(RoundDescriptor.SuperJeffpardy);

            _mockLoader.Verify(l => l.LoadCategoryAsync(
                It.Is<ManifestCategory>(mc => mc.Title == "DJ-0")), Times.Once);
        }

        [Fact]
        public async Task GetGameData_ExcludesUsedCategories()
        {
            // 12 categories; mark first 6 as used so only the last 6 are available
            var jeopardyCategories = CreateManifestCategories(12, "J");
            var doubleJeopardyCategories = CreateManifestCategories(6, "DJ");
            var finalCategories = CreateManifestCategories(1, "FJ");

            // Mark first 6 jeopardy categories as used
            var usedKeys = new HashSet<string>();
            for (int i = 0; i < 6; i++)
            {
                usedKeys.Add(jeopardyCategories[i].UniqueKey);
            }

            _mockUsedCategoryTracker
                .Setup(t => t.GetUsedCategoryKeysAsync())
                .ReturnsAsync(usedKeys as IReadOnlySet<string>);

            _mockCache.Setup(c => c.JeopardyCategoryList).Returns(jeopardyCategories);
            _mockCache.Setup(c => c.DoubleJeopardyCategoryList).Returns(doubleJeopardyCategories);
            _mockCache.Setup(c => c.FinalJeopardyCategoryList).Returns(finalCategories);

            _mockLoader.Setup(l => l.LoadCategoryAsync(It.IsAny<ManifestCategory>()))
                .ReturnsAsync(new Category { Title = "Test" });

            var controller = CreateController();
            await controller.GetGameData();

            // Verify that none of the first 6 (used) categories were loaded for round 0
            for (int i = 0; i < 6; i++)
            {
                var usedCat = jeopardyCategories[i];
                _mockLoader.Verify(l => l.LoadCategoryAsync(
                    It.Is<ManifestCategory>(mc => mc.UniqueKey == usedCat.UniqueKey)), Times.Never);
            }
        }

        [Fact]
        public async Task GetGameData_FallsBackToAllCategories_WhenNotEnoughUnused()
        {
            // Only 6 categories total, all marked as used → should fall back to full list
            var jeopardyCategories = CreateManifestCategories(6, "J");
            var doubleJeopardyCategories = CreateManifestCategories(6, "DJ");
            var finalCategories = CreateManifestCategories(1, "FJ");

            var usedKeys = new HashSet<string>();
            foreach (var cat in jeopardyCategories)
            {
                usedKeys.Add(cat.UniqueKey);
            }

            _mockUsedCategoryTracker
                .Setup(t => t.GetUsedCategoryKeysAsync())
                .ReturnsAsync(usedKeys as IReadOnlySet<string>);

            _mockCache.Setup(c => c.JeopardyCategoryList).Returns(jeopardyCategories);
            _mockCache.Setup(c => c.DoubleJeopardyCategoryList).Returns(doubleJeopardyCategories);
            _mockCache.Setup(c => c.FinalJeopardyCategoryList).Returns(finalCategories);

            _mockLoader.Setup(l => l.LoadCategoryAsync(It.IsAny<ManifestCategory>()))
                .ReturnsAsync(new Category { Title = "Test" });

            var controller = CreateController();
            var result = await controller.GetGameData();

            // Should still return 6 categories (fell back to full list)
            Assert.Equal(6, result.Rounds[0].Categories.Length);
        }

        [Fact]
        public async Task RecordGameComplete_ReturnsOk_AndCallsTracker()
        {
            _mockUsedCategoryTracker
                .Setup(t => t.RecordUsedCategoriesAsync(It.IsAny<IEnumerable<string>>()))
                .Returns(Task.CompletedTask);

            var controller = CreateController();
            var categories = new List<CategoryKey>
            {
                new CategoryKey { Season = 1, FileName = "j0.json", Index = 0 },
                new CategoryKey { Season = 1, FileName = "j1.json", Index = 1 },
            };

            var result = await controller.RecordGameComplete(categories);

            Assert.IsType<OkResult>(result);
            _mockUsedCategoryTracker.Verify(t => t.RecordUsedCategoriesAsync(
                It.Is<IEnumerable<string>>(keys =>
                    keys.Contains("1/j0.json/0") && keys.Contains("1/j1.json/1"))),
                Times.Once);
        }

        [Fact]
        public async Task RecordGameComplete_ReturnsBadRequest_WhenCategoriesIsNull()
        {
            var controller = CreateController();
            var result = await controller.RecordGameComplete(null);

            Assert.IsType<BadRequestObjectResult>(result);
            _mockUsedCategoryTracker.Verify(t => t.RecordUsedCategoriesAsync(It.IsAny<IEnumerable<string>>()), Times.Never);
        }

        [Fact]
        public async Task RecordGameComplete_ReturnsBadRequest_WhenCategoriesIsEmpty()
        {
            var controller = CreateController();
            var result = await controller.RecordGameComplete(new List<CategoryKey>());

            Assert.IsType<BadRequestObjectResult>(result);
        }
    }
}
