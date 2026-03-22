using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Moq;
using Xunit;

namespace Jeffpardy.Tests
{
    public class CategoriesControllerTests
    {
        private readonly Mock<ISeasonManifestCache> _mockCache;
        private readonly Mock<ICategoryLoader> _mockLoader;

        public CategoriesControllerTests()
        {
            _mockCache = new Mock<ISeasonManifestCache>();
            _mockLoader = new Mock<ICategoryLoader>();
        }

        private CategoriesController CreateController()
        {
            return new CategoriesController(_mockCache.Object, _mockLoader.Object);
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
    }
}
