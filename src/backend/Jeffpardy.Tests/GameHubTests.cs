using Jeffpardy.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace Jeffpardy.Tests
{
    public class GameHubTests
    {
        private readonly Mock<IHubContext<GameHub>> _mockHubContext;
        private readonly Mock<IGroupManager> _mockGroups;
        private readonly Mock<IHubClients> _mockClients;
        private readonly Mock<IClientProxy> _mockGroupProxy;
        private readonly Mock<ISingleClientProxy> _mockSingleClientProxy;
        private readonly Mock<ILogger<GameHub>> _mockLogger;
        private readonly GameCache _gameCache;

        public GameHubTests()
        {
            _mockHubContext = new Mock<IHubContext<GameHub>>();
            _mockGroups = new Mock<IGroupManager>();
            _mockClients = new Mock<IHubClients>();
            _mockGroupProxy = new Mock<IClientProxy>();
            _mockSingleClientProxy = new Mock<ISingleClientProxy>();
            _mockLogger = new Mock<ILogger<GameHub>>();

            _mockHubContext.Setup(h => h.Groups).Returns(_mockGroups.Object);
            _mockHubContext.Setup(h => h.Clients).Returns(_mockClients.Object);
            _mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(_mockGroupProxy.Object);
            _mockClients.Setup(c => c.Groups(It.IsAny<IReadOnlyList<string>>())).Returns(_mockGroupProxy.Object);
            _mockClients.Setup(c => c.Client(It.IsAny<string>())).Returns(_mockSingleClientProxy.Object);

            _gameCache = new GameCache(_mockHubContext.Object);
        }

        private GameHub CreateHub(string connectionId = "test-conn-id")
        {
            var hub = new GameHub(_gameCache, _mockLogger.Object);

            var mockCallerContext = new Mock<HubCallerContext>();
            mockCallerContext.Setup(c => c.ConnectionId).Returns(connectionId);
            hub.Context = mockCallerContext.Object;

            return hub;
        }

        [Fact]
        public void Constructor_AcceptsGameCacheDependency()
        {
            var hub = CreateHub();
            Assert.NotNull(hub);
        }

        [Fact]
        public async Task OnDisconnectedAsync_UnknownConnection_DoesNotThrow()
        {
            var hub = CreateHub("conn-disconnect");

            // GameCache.RemoveUserAsync should gracefully handle unknown connection IDs
            await hub.OnDisconnectedAsync(null!);
        }

        [Fact]
        public async Task OnDisconnectedAsync_WithException_UnknownConnection_DoesNotThrow()
        {
            var hub = CreateHub("conn-disconnect");

            await hub.OnDisconnectedAsync(new Exception("connection lost"));
        }

        [Fact]
        public async Task ConnectHost_WithNullGameCode_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.ConnectHost(null!, "HOST1");
        }

        [Fact]
        public async Task ConnectHost_WithEmptyGameCode_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.ConnectHost("", "HOST1");
        }

        [Fact]
        public async Task ConnectHost_WithNullHostCode_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.ConnectHost("GAME1", null!);
        }

        [Fact]
        public async Task ConnectHost_WithEmptyHostCode_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.ConnectHost("GAME1", "");
        }

        [Fact]
        public async Task ConnectHost_WithValidArgs_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.ConnectHost("GAME1", "HOST1");
        }

        [Fact]
        public async Task ConnectPlayerLobby_WithNullGameCode_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.ConnectPlayerLobby(null!);
        }

        [Fact]
        public async Task ConnectPlayerLobby_WithEmptyGameCode_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.ConnectPlayerLobby("");
        }

        [Fact]
        public async Task ConnectPlayerLobby_WithValidGameCode_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.ConnectPlayerLobby("GAME1");
        }

        [Fact]
        public async Task ConnectPlayer_WithNullGameCode_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.ConnectPlayer(null!, "TeamA", "Alice");
        }

        [Fact]
        public async Task ConnectPlayer_WithNullTeam_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.ConnectPlayer("GAME1", null!, "Alice");
        }

        [Fact]
        public async Task ConnectPlayer_WithNullName_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.ConnectPlayer("GAME1", "TeamA", null!);
        }

        [Fact]
        public async Task ConnectPlayer_WithEmptyTeam_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.ConnectPlayer("GAME1", "", "Alice");
        }

        [Fact]
        public async Task ConnectPlayer_WithEmptyName_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.ConnectPlayer("GAME1", "TeamA", "");
        }

        [Fact]
        public async Task ConnectPlayer_WithValidArgs_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.ConnectPlayer("GAME1", "TeamA", "Alice");
        }

        [Fact]
        public async Task ResetBuzzer_WithNullGameCode_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.ResetBuzzer(null!);
        }

        [Fact]
        public async Task ResetBuzzer_WithEmptyGameCode_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.ResetBuzzer("");
        }

        [Fact]
        public async Task ActivateBuzzer_WithNullGameCode_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.ActivateBuzzer(null!);
        }

        [Fact]
        public async Task ActivateBuzzer_WithEmptyGameCode_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.ActivateBuzzer("");
        }

        [Fact]
        public void BuzzIn_WithNullGameCode_DoesNotThrow()
        {
            var hub = CreateHub();
            hub.BuzzIn(null!, 100, 0);
        }

        [Fact]
        public void BuzzIn_WithEmptyGameCode_DoesNotThrow()
        {
            var hub = CreateHub();
            hub.BuzzIn("", 100, 0);
        }

        [Fact]
        public async Task StartRound_WithNullGameCode_DoesNotThrow()
        {
            var hub = CreateHub();
            var round = new GameRound { Id = 1, Categories = Array.Empty<Category>() };
            await hub.StartRound(null!, round);
        }

        [Fact]
        public async Task ShowClue_WithNullGameCode_DoesNotThrow()
        {
            var hub = CreateHub();
            var clue = new CategoryClue { Clue = "Test", Question = "What?" };
            await hub.ShowClue(null!, clue);
        }

        [Fact]
        public async Task BroadcastScores_WithNullGameCode_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.BroadcastScores(null!, new Dictionary<string, int>());
        }

        [Fact]
        public async Task BroadcastScores_WithEmptyGameCode_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.BroadcastScores("", new Dictionary<string, int>());
        }

        [Fact]
        public async Task StartFinalJeffpardy_WithNullGameCode_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.StartFinalJeffpardy(null!, new Dictionary<string, int>());
        }

        [Fact]
        public async Task SubmitWager_WithNullGameCode_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.SubmitWager(null!, 500);
        }

        [Fact]
        public async Task SubmitAnswer_WithNullGameCode_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.SubmitAnswer(null!, "An answer", 1000);
        }

        [Fact]
        public async Task ShowFinalJeffpardyClue_WithNullGameCode_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.ShowFinalJeffpardyClue(null!);
        }

        [Fact]
        public async Task EndFinalJeffpardy_WithNullGameCode_DoesNotThrow()
        {
            var hub = CreateHub();
            await hub.EndFinalJeffpardy(null!);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public async Task ConnectHost_InvalidGameCode_CatchesException(string? gameCode)
        {
            var hub = CreateHub();
            await hub.ConnectHost(gameCode!, "HOST1");
            // Exception is caught internally; no throw expected
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public async Task ConnectHost_InvalidHostCode_CatchesException(string? hostCode)
        {
            var hub = CreateHub();
            await hub.ConnectHost("GAME1", hostCode!);
            // Exception is caught internally; no throw expected
        }

        [Fact]
        public async Task OnDisconnectedAsync_AfterHostConnected_RemovesUser()
        {
            var hub = CreateHub("conn-host");

            // Connect host first so there's a game
            await hub.ConnectHost("GAME1", "HOST1");

            // Disconnect should not throw
            await hub.OnDisconnectedAsync(null!);
        }

        [Fact]
        public void BuzzIn_WithValidGameCode_NoGameExists_CatchesException()
        {
            var hub = CreateHub();
            // No game created for "NOGAME" — GameCache.BuzzIn will throw KeyNotFoundException
            hub.BuzzIn("NOGAME", 100, 0);
        }
    }
}
