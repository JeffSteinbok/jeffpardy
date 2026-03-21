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
    public class GameTests
    {
        private readonly Mock<IHubContext<GameHub>> _mockHubContext;
        private readonly Mock<IGroupManager> _mockGroups;
        private readonly Mock<IHubClients> _mockClients;
        private readonly Mock<IClientProxy> _mockGroupProxy;
        private readonly Mock<ISingleClientProxy> _mockSingleClientProxy;

        public GameTests()
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

        private Game CreateGame(string gameCode = "GAME1", string hostCode = "HOST1")
        {
            return new Game(_mockHubContext.Object, gameCode, hostCode);
        }

        [Fact]
        public void Constructor_SetsGameCode()
        {
            var game = CreateGame("TESTCODE", "HOSTCODE");
            Assert.Equal("TESTCODE", game.GameCode);
        }

        [Fact]
        public void Constructor_SetsHostCode()
        {
            var game = CreateGame("TESTCODE", "HOSTCODE");
            Assert.Equal("HOSTCODE", game.HostCode);
        }

        [Fact]
        public void IsEmptyGame_NoConnections_ReturnsTrue()
        {
            var game = CreateGame();
            Assert.True(game.IsEmptyGame);
        }

        [Fact]
        public async Task IsEmptyGame_AfterConnectHost_ReturnsFalse()
        {
            var game = CreateGame();
            await game.ConnectHostAsync("conn1");
            Assert.False(game.IsEmptyGame);
        }

        [Fact]
        public async Task ConnectHostAsync_AddsToHostGroup()
        {
            var game = CreateGame("GAME1", "HOST1");
            await game.ConnectHostAsync("conn1");

            _mockGroups.Verify(g => g.AddToGroupAsync("conn1", "GAME1-HOST", It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task ConnectHostAsync_AddsToGameGroup()
        {
            var game = CreateGame("GAME1", "HOST1");
            await game.ConnectHostAsync("conn1");

            _mockGroups.Verify(g => g.AddToGroupAsync("conn1", "GAME1", It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task ConnectHostAsync_SendsUserList()
        {
            var game = CreateGame();
            await game.ConnectHostAsync("conn1");

            // SendUserListAsync uses Clients.Client() → ISingleClientProxy
            _mockSingleClientProxy.Verify(c => c.SendCoreAsync(
                "updateUsers",
                It.IsAny<object?[]>(),
                It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task ConnectPlayerAsync_AddsPlayer_SendsUserList()
        {
            var game = CreateGame();
            await game.ConnectPlayerAsync("conn1", "TeamA", "Alice");

            // SendUserListToAllClientsAsync uses Clients.Groups() → IClientProxy
            _mockGroupProxy.Verify(c => c.SendCoreAsync(
                "updateUsers",
                It.IsAny<object?[]>(),
                It.IsAny<CancellationToken>()), Times.AtLeastOnce);
        }

        [Fact]
        public async Task ConnectPlayerAsync_GameIsNotEmpty()
        {
            var game = CreateGame();
            await game.ConnectPlayerAsync("conn1", "TeamA", "Alice");
            Assert.False(game.IsEmptyGame);
        }

        [Fact]
        public async Task RemoveUserAsync_RemovesPlayer_SendsUserList()
        {
            var game = CreateGame();
            await game.ConnectPlayerAsync("conn1", "TeamA", "Alice");

            _mockGroupProxy.Invocations.Clear();

            await game.RemoveUserAsync("conn1");

            _mockGroupProxy.Verify(c => c.SendCoreAsync(
                "updateUsers",
                It.IsAny<object?[]>(),
                It.IsAny<CancellationToken>()), Times.AtLeastOnce);
        }

        [Fact]
        public async Task RemoveUserAsync_NonPlayer_DoesNotThrow()
        {
            var game = CreateGame();
            await game.ConnectHostAsync("conn-host");

            await game.RemoveUserAsync("conn-host");
        }

        [Fact]
        public async Task BuzzIn_FirstBuzzer_StartsTimer()
        {
            var game = CreateGame();
            await game.ConnectPlayerAsync("conn1", "TeamA", "Alice");

            game.BuzzIn("conn1", 100, 0);

            // No exception means timer started successfully
        }

        [Fact]
        public async Task BuzzIn_FasterTime_Wins()
        {
            var game = CreateGame();
            await game.ConnectPlayerAsync("conn1", "TeamA", "Alice");
            await game.ConnectPlayerAsync("conn2", "TeamB", "Bob");

            game.BuzzIn("conn1", 200, 0);
            game.BuzzIn("conn2", 100, 0);

            await game.AssignWinnerAsync();

            _mockGroupProxy.Verify(c => c.SendCoreAsync(
                "assignWinner",
                It.Is<object?[]>(args =>
                    args.Length >= 2 &&
                    ((Player)args[0]!).Name == "Bob"),
                It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task BuzzIn_TeamAlreadyWon_IsSkipped()
        {
            var game = CreateGame();
            await game.ConnectPlayerAsync("conn1", "TeamA", "Alice");
            await game.ConnectPlayerAsync("conn2", "TeamB", "Bob");

            // First round: TeamA wins
            game.BuzzIn("conn1", 100, 0);
            await game.AssignWinnerAsync();

            // Activate buzzer resets winning user but keeps winner teams
            await game.ActivateBuzzerAsync();

            // Second round: TeamA buzzes faster but should be skipped
            game.BuzzIn("conn1", 50, 0);
            game.BuzzIn("conn2", 200, 0);
            await game.AssignWinnerAsync();

            _mockGroupProxy.Verify(c => c.SendCoreAsync(
                "assignWinner",
                It.Is<object?[]>(args =>
                    args.Length >= 2 &&
                    ((Player)args[0]!).Name == "Bob"),
                It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task BuzzIn_NegativeHandicap_IsIgnored()
        {
            var game = CreateGame();
            await game.ConnectPlayerAsync("conn1", "TeamA", "Alice");
            await game.ConnectPlayerAsync("conn2", "TeamB", "Bob");

            // Alice buzzes at 200ms with -100 handicap (should be ignored, time stays 200)
            game.BuzzIn("conn1", 200, -100);
            // Bob buzzes at 150ms with 0 handicap
            game.BuzzIn("conn2", 150, 0);

            await game.AssignWinnerAsync();

            _mockGroupProxy.Verify(c => c.SendCoreAsync(
                "assignWinner",
                It.Is<object?[]>(args =>
                    args.Length >= 2 &&
                    ((Player)args[0]!).Name == "Bob"),
                It.IsAny<CancellationToken>()), Times.Once);
        }

        [Theory]
        [InlineData(100, 50, 150)]
        [InlineData(100, 0, 100)]
        public async Task BuzzIn_PositiveHandicap_AddsToTime(int baseTime, int handicap, int expectedEffectiveTime)
        {
            var game = CreateGame();
            await game.ConnectPlayerAsync("conn1", "TeamA", "Alice");
            await game.ConnectPlayerAsync("conn2", "TeamB", "Bob");

            game.BuzzIn("conn1", baseTime, handicap);
            game.BuzzIn("conn2", expectedEffectiveTime + 1, 0);

            await game.AssignWinnerAsync();

            // Alice should win because her adjusted time equals expectedEffectiveTime
            // which is less than Bob's time of expectedEffectiveTime + 1
            _mockGroupProxy.Verify(c => c.SendCoreAsync(
                "assignWinner",
                It.Is<object?[]>(args =>
                    args.Length >= 2 &&
                    ((Player)args[0]!).Name == "Alice"),
                It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task ActivateBuzzerAsync_ResetsWinningBuzzerState()
        {
            var game = CreateGame();
            await game.ConnectPlayerAsync("conn1", "TeamA", "Alice");

            game.BuzzIn("conn1", 100, 0);
            await game.ActivateBuzzerAsync();

            _mockGroupProxy.Verify(c => c.SendCoreAsync(
                "activateBuzzer",
                It.IsAny<object?[]>(),
                It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task ResetBuzzerAsync_ClearsAllWinnerTeams()
        {
            var game = CreateGame();
            await game.ConnectPlayerAsync("conn1", "TeamA", "Alice");
            await game.ConnectPlayerAsync("conn2", "TeamB", "Bob");

            // TeamA wins
            game.BuzzIn("conn1", 100, 0);
            await game.AssignWinnerAsync();

            // Reset buzzer clears winner teams
            await game.ResetBuzzerAsync();

            _mockGroupProxy.Verify(c => c.SendCoreAsync(
                "resetBuzzer",
                It.IsAny<object?[]>(),
                It.IsAny<CancellationToken>()), Times.Once);

            // After reset, TeamA should be able to buzz in again (not skipped)
            game.BuzzIn("conn1", 100, 0);
            await game.AssignWinnerAsync();

            // assignWinner called twice total with Alice (once before reset, once after)
            _mockGroupProxy.Verify(c => c.SendCoreAsync(
                "assignWinner",
                It.Is<object?[]>(args =>
                    args.Length >= 2 &&
                    ((Player)args[0]!).Name == "Alice"),
                It.IsAny<CancellationToken>()), Times.Exactly(2));
        }

        [Fact]
        public async Task ConnectPlayerLobbyAsync_AddsConnection_SendsUserList()
        {
            var game = CreateGame();
            await game.ConnectPlayerLobbyAsync("conn-lobby");
            Assert.False(game.IsEmptyGame);

            // SendUserListAsync uses Clients.Client() → ISingleClientProxy
            _mockSingleClientProxy.Verify(c => c.SendCoreAsync(
                "updateUsers",
                It.IsAny<object?[]>(),
                It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task StartRoundAsync_SendsToHostGroup()
        {
            var game = CreateGame();
            var round = new GameRound { Id = 1, Categories = Array.Empty<Category>() };

            await game.StartRoundAsync(round);

            _mockGroupProxy.Verify(c => c.SendCoreAsync(
                "startRound",
                It.IsAny<object?[]>(),
                It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task ShowClueAsync_SendsToHostGroup()
        {
            var game = CreateGame();
            var clue = new CategoryClue { Clue = "A test clue", Question = "What is a test?" };

            await game.ShowClueAsync(clue);

            _mockGroupProxy.Verify(c => c.SendCoreAsync(
                "showClue",
                It.IsAny<object?[]>(),
                It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
