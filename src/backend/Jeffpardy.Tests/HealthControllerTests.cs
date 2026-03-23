using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace Jeffpardy.Tests
{
    public class HealthControllerTests
    {
        private readonly Mock<ISeasonManifestCache> _mockCache;

        public HealthControllerTests()
        {
            _mockCache = new Mock<ISeasonManifestCache>();
        }

        private HealthController CreateController()
        {
            return new HealthController(_mockCache.Object);
        }

        private void SetupCacheLists(int jeopardyCount, int doubleJeopardyCount, int finalJeopardyCount)
        {
            var jeopardyList = new List<ManifestCategory>();
            for (int i = 0; i < jeopardyCount; i++)
                jeopardyList.Add(new ManifestCategory { Title = $"J-{i}" });

            var doubleJeopardyList = new List<ManifestCategory>();
            for (int i = 0; i < doubleJeopardyCount; i++)
                doubleJeopardyList.Add(new ManifestCategory { Title = $"DJ-{i}" });

            var finalJeopardyList = new List<ManifestCategory>();
            for (int i = 0; i < finalJeopardyCount; i++)
                finalJeopardyList.Add(new ManifestCategory { Title = $"FJ-{i}" });

            _mockCache.Setup(c => c.JeopardyCategoryList).Returns(jeopardyList);
            _mockCache.Setup(c => c.DoubleJeopardyCategoryList).Returns(doubleJeopardyList);
            _mockCache.Setup(c => c.FinalJeopardyCategoryList).Returns(finalJeopardyList);
        }

        [Fact]
        public void GetHealth_WithCategories_ReturnsOk()
        {
            SetupCacheLists(10, 5, 3);

            var controller = CreateController();
            var result = controller.GetHealth();

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public void GetHealth_WithCategories_ReturnsHealthyStatus()
        {
            SetupCacheLists(10, 5, 3);

            var controller = CreateController();
            var result = controller.GetHealth();

            var okResult = Assert.IsType<OkObjectResult>(result);
            var health = Assert.IsType<HealthStatus>(okResult.Value);
            Assert.Equal("Healthy", health.Status);
        }

        [Fact]
        public void GetHealth_WithCategories_ReturnsCategoriesLoaded()
        {
            SetupCacheLists(10, 5, 3);

            var controller = CreateController();
            var result = controller.GetHealth();

            var okResult = Assert.IsType<OkObjectResult>(result);
            var health = Assert.IsType<HealthStatus>(okResult.Value);
            Assert.True(health.CategoriesLoaded);
        }

        [Fact]
        public void GetHealth_WithCategories_ReturnsCorrectCounts()
        {
            SetupCacheLists(10, 5, 3);

            var controller = CreateController();
            var result = controller.GetHealth();

            var okResult = Assert.IsType<OkObjectResult>(result);
            var health = Assert.IsType<HealthStatus>(okResult.Value);
            Assert.Equal(18, health.TotalCategories);
            Assert.Equal(10, health.JeffpardyCategories);
            Assert.Equal(5, health.SuperJeffpardyCategories);
            Assert.Equal(3, health.FinalJeffpardyCategories);
        }

        [Fact]
        public void GetHealth_WithNoCategories_Returns503()
        {
            SetupCacheLists(0, 0, 0);

            var controller = CreateController();
            var result = controller.GetHealth();

            var statusResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(503, statusResult.StatusCode);
        }

        [Fact]
        public void GetHealth_WithNoCategories_ReturnsDegradedStatus()
        {
            SetupCacheLists(0, 0, 0);

            var controller = CreateController();
            var result = controller.GetHealth();

            var statusResult = Assert.IsType<ObjectResult>(result);
            var health = Assert.IsType<HealthStatus>(statusResult.Value);
            Assert.Equal("Degraded", health.Status);
            Assert.False(health.CategoriesLoaded);
        }

        [Fact]
        public void GetHealth_WithPartialCategories_ReturnsHealthy()
        {
            SetupCacheLists(5, 0, 0);

            var controller = CreateController();
            var result = controller.GetHealth();

            var okResult = Assert.IsType<OkObjectResult>(result);
            var health = Assert.IsType<HealthStatus>(okResult.Value);
            Assert.Equal("Healthy", health.Status);
            Assert.True(health.CategoriesLoaded);
            Assert.Equal(5, health.TotalCategories);
        }
    }
}
