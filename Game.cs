using Jeffpardy.Hubs;
using Microsoft.AspNetCore.SignalR;
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
    class Game
    {
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

        private Dictionary<string, Team> TeamDictionary
        {
            get
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
                return buzzerTeams;
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
                await this.AssignWinnerAsync();
            };

        }

        public bool IsEmptyGame => this.connections.Count == 0;

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

            lock (this)
            {
                this.players.Add(connectionId, new Player()
                {
                    ConnectionId = connectionId,
                    Team = team,
                    Name = name
                }); 
            }

            await this.SendUserListToAllClientsAsync();
        }

        public async Task RemoveUserAsync(string connectionId)
        {
            if (this.players.ContainsKey(connectionId))
            {
                var item = this.players[connectionId];

                this.players.Remove(item.ConnectionId);

                await SendUserListToAllClientsAsync();

            }
        }

        public async Task ResetBuzzerAsync()
        {
            lock (this)
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
            lock (this)
            {
                this.winningBuzzerUser = null;
                this.winningBuzzerTimeInMilliseconds = int.MaxValue;
                this.buzzerWindowTimer.Stop();
            }
            await gameHubContext.Clients.Group(this.GameCode).SendAsync("activateBuzzer");
        }

        public async Task AssignWinnerAsync()
        {
            lock (this)
            {
                this.buzzerWindowTimer.Stop();
                this.buzzerWinnerTeams.Add(this.winningBuzzerUser.Team);
            }
            await gameHubContext.Clients.Group(this.GameCode).SendAsync("assignWinner", this.winningBuzzerUser, this.winningBuzzerTimeInMilliseconds);
        }

        public void BuzzIn(string connectionId, int timeInMilliseconds, int handicapInMilliseconds)
        {
            lock (this)
            {
                Player buzzerUser = players[connectionId];
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

        public async Task ShowClueAsync(CategoryClue clue)
        {
            await gameHubContext.Clients.Groups(this.hostGroupName).SendAsync("showClue", clue);
        }

        public async Task StartFinalJeffpardyAsync(Dictionary<string, int> scores)
        {
            await gameHubContext.Clients.Group(this.GameCode).SendAsync("startFinalJeffpardy", scores);
        }

        public async Task SubmitWagerAsync(string connectionId, int wager)
        {
            await gameHubContext.Clients.Group(this.hostGroupName).SendAsync("submitWager",
                                                                                players[connectionId], 
                                                                                wager);
        }

        public async Task SubmitAnswerAsync(string connectionId, string answer, int timeInMilliseconds)
        {
            await gameHubContext.Clients.Group(this.hostGroupName).SendAsync("submitAnswer",
                                                                                players[connectionId],
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
            this.connections[connectionId] = true;
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


    }

}
