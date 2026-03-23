using System;
using System.Collections.Generic;
using Moq;
using Xunit;

namespace Jeffpardy.Tests
{
    public class DiagnosticsControllerTests
    {
        private readonly Mock<ISeasonManifestCache> _mockCache;

        public DiagnosticsControllerTests()
        {
            _mockCache = new Mock<ISeasonManifestCache>();
        }

        private DiagnosticsController CreateController()
        {
            return new DiagnosticsController(_mockCache.Object);
        }

        private void SetupCacheLists(int jeopardyCount, int doubleJeopardyCount, int finalJeopardyCount)
        {
            var jeopardyList = new List<ManifestCategory>();
            for (int i = 0; i < jeopardyCount; i++)
                jeopardyList.Add(new ManifestCategory
                {
                    Title = $"J-{i}",
                    AirDate = new DateTime(2020, 1, 1).AddDays(i)
                });

            var doubleJeopardyList = new List<ManifestCategory>();
            for (int i = 0; i < doubleJeopardyCount; i++)
                doubleJeopardyList.Add(new ManifestCategory
                {
                    Title = $"DJ-{i}",
                    AirDate = new DateTime(2021, 1, 1).AddDays(i)
                });

            var finalJeopardyList = new List<ManifestCategory>();
            for (int i = 0; i < finalJeopardyCount; i++)
                finalJeopardyList.Add(new ManifestCategory
                {
                    Title = $"FJ-{i}",
                    AirDate = new DateTime(2022, 1, 1).AddDays(i)
                });

            _mockCache.Setup(c => c.JeopardyCategoryList).Returns(jeopardyList);
            _mockCache.Setup(c => c.DoubleJeopardyCategoryList).Returns(doubleJeopardyList);
            _mockCache.Setup(c => c.FinalJeopardyCategoryList).Returns(finalJeopardyList);
        }

        [Fact]
        public void GetDiagnostics_ReturnsNonNull()
        {
            SetupCacheLists(1, 1, 1);

            var controller = CreateController();
            var result = controller.GetDiagnostics();

            Assert.NotNull(result);
        }

        [Fact]
        public void GetDiagnostics_ReturnsCorrectJeopardyCategoryCount()
        {
            SetupCacheLists(10, 5, 3);

            var controller = CreateController();
            var result = controller.GetDiagnostics();

            Assert.Equal(10, result.NumJeopardyCategories);
        }

        [Fact]
        public void GetDiagnostics_ReturnsCorrectSuperJeffpardyCategoryCount()
        {
            SetupCacheLists(10, 5, 3);

            var controller = CreateController();
            var result = controller.GetDiagnostics();

            Assert.Equal(5, result.NumSuperJeffpardyCategories);
        }

        [Fact]
        public void GetDiagnostics_ReturnsCorrectFinalJeffpardyCategoryCount()
        {
            SetupCacheLists(10, 5, 3);

            var controller = CreateController();
            var result = controller.GetDiagnostics();

            Assert.Equal(3, result.NumFinalJeffpardyCategories);
        }

        [Fact]
        public void GetDiagnostics_ReturnsCorrectTotalCategoryCount()
        {
            SetupCacheLists(10, 5, 3);

            var controller = CreateController();
            var result = controller.GetDiagnostics();

            Assert.Equal(18, result.NumCategories);
        }

        [Fact]
        public void GetDiagnostics_ReturnsOldestCategory()
        {
            SetupCacheLists(2, 2, 2);

            var controller = CreateController();
            var result = controller.GetDiagnostics();

            Assert.Equal(new DateTime(2020, 1, 1), result.OldestCategory);
        }

        [Fact]
        public void GetDiagnostics_ReturnsNewestCategory()
        {
            SetupCacheLists(2, 2, 2);

            var controller = CreateController();
            var result = controller.GetDiagnostics();

            // Newest is FinalJeopardy[1] = 2022-01-02
            Assert.Equal(new DateTime(2022, 1, 2), result.NewestCategory);
        }
    }
}
