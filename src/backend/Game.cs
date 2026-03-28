using Jeffpardy.Hubs;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Timers;

namespace Jeffpardy
{
    /// <summary>
    /// Represents a game in progress.  
    /// Operations on this class may cause side-effects such as outgoing SignalR calls to other clients.
    /// </summary>
    class Game : IDisposable
    {
        private readonly object _lock = new();
        /// <summary>
        /// Unique code for the game
        /// </summary>
        public string GameCode { get; private set; }

        /// <summary>
        /// Code to allow the host to join with a secondary client
        /// </summary>
        public string HostCode { get; private set; }

        /// <summary>
        /// Name of the group of clients connected as the host.
        /// </summary>
        private readonly string hostGroupName;

        /// <summary>
        /// Singleton gameHubContext to send requests to
        /// </summary>
        private readonly IHubContext<GameHub> gameHubContext;

        /// <summary>
        /// Players in the game; by connection Id
        /// </summary>
        readonly Dictionary<string, Player> players = new Dictionary<string, Player>();

        /// <summary>
        /// Dictionary of SignalR connections.  Needed to track when we can remove this game from memory.
        /// </summary>
        readonly Dictionary<string, bool> connections = new Dictionary<string, bool>();

        /// <summary>
        /// Whether a round has started. Once true, teams are permanent.
        /// </summary>
        bool gameStarted = false;

        /// <summary>
        /// Team names that are locked in once the game starts. These persist even if all players disconnect.
        /// </summary>
        readonly HashSet<string> permanentTeamNames = new HashSet<string>();

        private Dictionary<string, Team> TeamDictionary
        {
            get
            {
                lock (_lock)
                {
                    var buzzerTeams = this.players.Values
                                                .GroupBy(x => x.Team)
                                                .OrderBy(p => p.Key.ToString())
                                                .ToDictionary(x => x.Key,
                                                              x => new Team()
                                                              {
                                                                  Name = x.Key,
                                                                  Players = x.OrderBy(o => o.Name).ToList()
                                                              });

                    // Include permanent teams even if they have no connected players
                    foreach (var teamName in this.permanentTeamNames)
                    {
                        if (!buzzerTeams.ContainsKey(teamName))
                        {
                            buzzerTeams[teamName] = new Team()
                            {
                                Name = teamName,
                                Players = new List<Player>()
                            };
                        }
                    }

                    return buzzerTeams;
                }
            }
        }

        int winningBuzzerTimeInMilliseconds = int.MaxValue;
        Player winningBuzzerUser;

        /// <summary>
        /// List of all winners for this session.  A team can win only once per session.
        /// </summary>
        readonly List<string> buzzerWinnerTeams = new List<string>();

        readonly Timer buzzerWindowTimer;

        public Game(IHubContext<GameHub> buzzerHubContext, string gameCode, string hostCode)
        {
            this.GameCode = gameCode;
            this.HostCode = hostCode;
            this.hostGroupName = gameCode + "-HOST";
            this.gameHubContext = buzzerHubContext;

            this.buzzerWindowTimer = new Timer(500);
            this.buzzerWindowTimer.Elapsed += async (sender, args) =>
            {
                try
                {
                    await this.AssignWinnerAsync();
                }
                catch (Exception)
                {
                    // Prevent unobserved exceptions from crashing the process.
                }
            };

        }

        public bool IsEmptyGame
        {
            get
            {
                lock (_lock)
                {
                    return this.connections.Count == 0;
                }
            }
        }

        public async Task ConnectHostAsync(string connectionId)
        {
            await this.gameHubContext.Groups.AddToGroupAsync(connectionId, this.hostGroupName);
            await this.AddConnectionToGame(connectionId);
            await this.SendUserListAsync(connectionId);
        }

        public async Task ConnectPlayerLobbyAsync(string connectionId)
        {
            await this.AddConnectionToGame(connectionId);
            await this.SendUserListAsync(connectionId);
        }

        public async Task ConnectPlayerAsync(string connectionId, string team, string name)
        {
            await this.AddConnectionToGame(connectionId);

            lock (_lock)
            {
                this.players.Add(connectionId, new Player()
                {
                    ConnectionId = connectionId,
                    Team = team,
                    Name = name
                });

                // If the game has already started, lock in this team as permanent too
                if (this.gameStarted)
                {
                    this.permanentTeamNames.Add(team);
                }
            }

            await this.SendUserListToAllClientsAsync();
        }

        public async Task RemoveUserAsync(string connectionId)
        {
            Player item;
            lock (_lock)
            {
                this.connections.Remove(connectionId);

                if (!this.players.TryGetValue(connectionId, out item))
                {
                    return;
                }

                this.players.Remove(item.ConnectionId);
            }

            await SendUserListToAllClientsAsync();
        }

        public async Task ResetBuzzerAsync()
        {
            lock (_lock)
            {
                this.buzzerWinnerTeams.Clear();
                this.winningBuzzerUser = null;
                this.winningBuzzerTimeInMilliseconds = int.MaxValue;
                this.buzzerWindowTimer.Stop();
            }
            await gameHubContext.Clients.Group(this.GameCode).SendAsync("resetBuzzer");
        }

        public async Task ActivateBuzzerAsync()
        {
            lock (_lock)
            {
                this.winningBuzzerUser = null;
                this.winningBuzzerTimeInMilliseconds = int.MaxValue;
                this.buzzerWindowTimer.Stop();
            }
            await gameHubContext.Clients.Group(this.GameCode).SendAsync("activateBuzzer");
        }

        public async Task AssignWinnerAsync()
        {
            Player winner;
            int winningTime;
            lock (_lock)
            {
                this.buzzerWindowTimer.Stop();

                if (this.winningBuzzerUser == null)
                {
                    return;
                }

                this.buzzerWinnerTeams.Add(this.winningBuzzerUser.Team);
                winner = this.winningBuzzerUser;
                winningTime = this.winningBuzzerTimeInMilliseconds;
            }
            await gameHubContext.Clients.Group(this.GameCode).SendAsync("assignWinner", winner, winningTime);
        }

        public void BuzzIn(string connectionId, int timeInMilliseconds, int handicapInMilliseconds)
        {
            lock (_lock)
            {
                if (!players.TryGetValue(connectionId, out Player buzzerUser))
                {
                    return;
                }

                if (this.buzzerWinnerTeams.Contains(buzzerUser.Team))
                {
                    // This team already won this session and isn't eligible; ignore it.
                    return;

                }
                if (!this.buzzerWindowTimer.Enabled)
                {
                    buzzerWindowTimer.Start();
                }

                // Adjust the time by the handcicap - note the handicap must be positive.
                // This prevents people like Nick from changing the handicap to a negative number to get sub-0 times.
                if (handicapInMilliseconds > 0)
                {
                    timeInMilliseconds += handicapInMilliseconds;
                }

                if (timeInMilliseconds < this.winningBuzzerTimeInMilliseconds)
                {
                    this.winningBuzzerTimeInMilliseconds = timeInMilliseconds;
                    this.winningBuzzerUser = buzzerUser;
                }
            }
        }

        public async Task StartRoundAsync(GameRound round)
        {
            lock (_lock)
            {
                if (!this.gameStarted)
                {
                    this.gameStarted = true;
                }

                // Lock in all current teams as permanent
                foreach (var player in this.players.Values)
                {
                    this.permanentTeamNames.Add(player.Team);
                }
            }

            await gameHubContext.Clients.Groups(this.hostGroupName).SendAsync("startRound", round);
        }

        public async Task ShowClueAsync(CategoryClue clue)
        {
            await gameHubContext.Clients.Groups(this.hostGroupName).SendAsync("showClue", clue);
        }

        public async Task BroadcastScoresAsync(Dictionary<string, int> scores)
        {
            await gameHubContext.Clients.Group(this.GameCode).SendAsync("broadcastScores", scores);
        }

        public async Task StartFinalJeffpardyAsync(Dictionary<string, int> scores)
        {
            await gameHubContext.Clients.Group(this.GameCode).SendAsync("startFinalJeffpardy", scores);
        }

        public async Task SubmitWagerAsync(string connectionId, int wager)
        {
            Player player;
            lock (_lock)
            {
                if (!players.TryGetValue(connectionId, out player))
                {
                    return;
                }
            }

            await gameHubContext.Clients.Group(this.hostGroupName).SendAsync("submitWager",
                                                                                player, 
                                                                                wager);

            // Notify all players that this player locked in their wager
            await gameHubContext.Clients.Group(this.GameCode).SendAsync("wagerLockedIn", connectionId);
        }

        public async Task SubmitAnswerAsync(string connectionId, string answer, int timeInMilliseconds)
        {
            Player player;
            lock (_lock)
            {
                if (!players.TryGetValue(connectionId, out player))
                {
                    return;
                }
            }

            await gameHubContext.Clients.Group(this.hostGroupName).SendAsync("submitAnswer",
                                                                                player,
                                                                                answer,
                                                                                timeInMilliseconds);
        }

        private async Task SendUserListAsync(string connectionId)
        {
            await gameHubContext.Clients.Client(connectionId).SendAsync("updateUsers", this.TeamDictionary);
        }

        private async Task SendUserListToAllClientsAsync()
        {
            await gameHubContext.Clients.Groups(this.GameCode).SendAsync("updateUsers", this.TeamDictionary);
        }

        private async Task AddConnectionToGame(string connectionId)
        {
            lock (_lock)
            {
                this.connections[connectionId] = true;
            }
            await this.gameHubContext.Groups.AddToGroupAsync(connectionId, this.GameCode);
        }

        public async Task ShowFinalJeffpardyClueAsync()
        {
            await gameHubContext.Clients.Group(this.GameCode).SendAsync("showFinalJeffpardyClue");
        }

        public async Task EndFinalJeffpardyAsync()
        {
            await gameHubContext.Clients.Group(this.GameCode).SendAsync("endFinalJeffpardy");
        }

        public void Dispose()
        {
            buzzerWindowTimer.Stop();
            buzzerWindowTimer.Dispose();
        }

    }

}
