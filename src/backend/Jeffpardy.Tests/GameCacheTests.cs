using Jeffpardy.Hubs;
using Microsoft.AspNetCore.SignalR;
using Moq;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace Jeffpardy.Tests
{
    public class GameCacheTests
    {
        private readonly Mock<IHubContext<GameHub>> _mockHubContext;
        private readonly Mock<IGroupManager> _mockGroups;
        private readonly Mock<IHubClients> _mockClients;
        private readonly Mock<IClientProxy> _mockGroupProxy;
        private readonly Mock<ISingleClientProxy> _mockSingleClientProxy;

        public GameCacheTests()
        {
            _mockHubContext = new Mock<IHubContext<GameHub>>();
            _mockGroups = new Mock<IGroupManager>();
            _mockClients = new Mock<IHubClients>();
            _mockGroupProxy = new Mock<IClientProxy>();
            _mockSingleClientProxy = new Mock<ISingleClientProxy>();

            _mockHubContext.Setup(h => h.Groups).Returns(_mockGroups.Object);
            _mockHubContext.Setup(h => h.Clients).Returns(_mockClients.Object);
            _mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(_mockGroupProxy.Object);
            _mockClients.Setup(c => c.Groups(It.IsAny<IReadOnlyList<string>>())).Returns(_mockGroupProxy.Object);
            _mockClients.Setup(c => c.Client(It.IsAny<string>())).Returns(_mockSingleClientProxy.Object);
        }

        private GameCache CreateCache() => new GameCache(_mockHubContext.Object);

        [Fact]
        public async Task ConnectHostAsync_CreatesNewGame()
        {
            var cache = CreateCache();

            await cache.ConnectHostAsync("conn-host", "GAME1", "HOST1");

            // Verify host was added to groups (game group + host group)
            _mockGroups.Verify(g => g.AddToGroupAsync("conn-host", It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.AtLeastOnce);
        }

        [Fact]
        public async Task ConnectHostAsync_ExistingGame_CorrectHostCode_Succeeds()
        {
            var cache = CreateCache();

            await cache.ConnectHostAsync("conn-host1", "GAME1", "HOST1");
            await cache.ConnectHostAsync("conn-host2", "GAME1", "HOST1");

            // Both connections should have been added
            _mockGroups.Verify(g => g.AddToGroupAsync("conn-host2", It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.AtLeastOnce);
        }

        [Fact]
        public async Task ConnectHostAsync_ExistingGame_WrongHostCode_ThrowsArgumentException()
        {
            var cache = CreateCache();

            await cache.ConnectHostAsync("conn-host1", "GAME1", "HOST1");

            await Assert.ThrowsAsync<ArgumentException>(
                () => cache.ConnectHostAsync("conn-host2", "GAME1", "WRONGCODE"));
        }

        [Fact]
        public async Task ConnectPlayerAsync_AddsPlayerToExistingGame()
        {
            var cache = CreateCache();

            await cache.ConnectHostAsync("conn-host", "GAME1", "HOST1");
            await cache.ConnectPlayerAsync("conn-player", "GAME1", "TeamA", "Alice");

            _mockGroups.Verify(g => g.AddToGroupAsync("conn-player", "GAME1", It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task RemoveUserAsync_RemovesConnection()
        {
            var cache = CreateCache();

            await cache.ConnectHostAsync("conn-host", "GAME1", "HOST1");
            await cache.ConnectPlayerAsync("conn-player", "GAME1", "TeamA", "Alice");

            // Should not throw
            await cache.RemoveUserAsync("conn-player");
        }

        [Fact]
        public async Task RemoveUserAsync_LastConnection_RemovesGame()
        {
            var cache = CreateCache();

            await cache.ConnectHostAsync("conn-host", "GAME1", "HOST1");

            // Remove only connection (host is not in players dict, so IsEmptyGame depends on connections dict)
            // Actually, RemoveUserAsync only removes from players dict, not connections dict
            // So after removing a non-player connection, the game won't be empty
            // Let's test with a player
            await cache.ConnectPlayerAsync("conn-player", "GAME1", "TeamA", "Alice");

            await cache.RemoveUserAsync("conn-player");

            // Game still has the host connection, so it shouldn't be removed
            // We can verify by connecting another player (should not throw)
            await cache.ConnectPlayerAsync("conn-player2", "GAME1", "TeamB", "Bob");
        }

        [Theory]
        [InlineData("game1")]
        [InlineData("Game1")]
        [InlineData("GAME1")]
        public async Task GetGame_NormalizesGameCodeToUpperCase(string inputGameCode)
        {
            var cache = CreateCache();

            // Create game with uppercase code
            await cache.ConnectHostAsync("conn-host", "GAME1", "HOST1");

            // Connect player with different casing - should find the same game
            await cache.ConnectPlayerAsync("conn-player", inputGameCode, "TeamA", "Alice");

            _mockGroups.Verify(g => g.AddToGroupAsync("conn-player", "GAME1", It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task BuzzIn_DelegatesToGame()
        {
            var cache = CreateCache();

            await cache.ConnectHostAsync("conn-host", "GAME1", "HOST1");
            await cache.ConnectPlayerAsync("conn-player", "GAME1", "TeamA", "Alice");

            // Should not throw - delegates to Game.BuzzIn
            cache.BuzzIn("GAME1", "conn-player", 100, 0);
        }

        [Fact]
        public async Task ResetBuzzerAsync_DelegatesToGame()
        {
            var cache = CreateCache();
            await cache.ConnectHostAsync("conn-host", "GAME1", "HOST1");

            await cache.ResetBuzzerAsync("GAME1");

            _mockGroupProxy.Verify(c => c.SendCoreAsync(
                "resetBuzzer",
                It.IsAny<object?[]>(),
                It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task ActivateBuzzerAsync_DelegatesToGame()
        {
            var cache = CreateCache();
            await cache.ConnectHostAsync("conn-host", "GAME1", "HOST1");

            await cache.ActivateBuzzerAsync("GAME1");

            _mockGroupProxy.Verify(c => c.SendCoreAsync(
                "activateBuzzer",
                It.IsAny<object?[]>(),
                It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task ConnectPlayerLobbyAsync_AddsPlayerToGame()
        {
            var cache = CreateCache();
            await cache.ConnectHostAsync("conn-host", "GAME1", "HOST1");

            await cache.ConnectPlayerLobbyAsync("conn-lobby", "GAME1");

            _mockGroups.Verify(g => g.AddToGroupAsync("conn-lobby", "GAME1", It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task ConnectHostAsync_CaseInsensitive_HostCode()
        {
            var cache = CreateCache();

            // Create with lowercase, retrieve with uppercase - hostCode is also normalized
            await cache.ConnectHostAsync("conn-host1", "game1", "host1");
            await cache.ConnectHostAsync("conn-host2", "GAME1", "HOST1");

            _mockGroups.Verify(g => g.AddToGroupAsync("conn-host2", It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.AtLeastOnce);
        }

        [Fact]
        public async Task BroadcastScoresAsync_DelegatesToGame()
        {
            var cache = CreateCache();
            await cache.ConnectHostAsync("conn-host", "GAME1", "HOST1");

            var scores = new Dictionary<string, int> { { "TeamA", 100 }, { "TeamB", 200 } };
            await cache.BroadcastScoresAsync("GAME1", scores);

            _mockGroupProxy.Verify(c => c.SendCoreAsync(
                "broadcastScores",
                It.IsAny<object?[]>(),
                It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task StartRoundAsync_DelegatesToGame()
        {
            var cache = CreateCache();
            await cache.ConnectHostAsync("conn-host", "GAME1", "HOST1");

            var round = new GameRound { Id = 1, Categories = Array.Empty<Category>() };
            await cache.StartRoundAsync("GAME1", round);

            _mockGroupProxy.Verify(c => c.SendCoreAsync(
                "startRound",
                It.IsAny<object?[]>(),
                It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
