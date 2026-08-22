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
        /// Players in the game, keyed by their durable PlayerId (stable across
        /// reconnects). For older clients that don't supply a PlayerId, the
        /// connection id is used as the key.
        /// </summary>
        readonly Dictionary<string, Player> players = new Dictionary<string, Player>();

        /// <summary>
        /// Maps a live SignalR connection id to the durable PlayerId that owns
        /// it. Used to resolve the player for buzz/answer messages that arrive
        /// by connection when the client doesn't (yet) supply a PlayerId.
        /// </summary>
        readonly Dictionary<string, string> connectionToPlayerId = new Dictionary<string, string>();

        /// <summary>
        /// Dictionary of SignalR connections.  Needed to track when we can remove this game from memory.
        /// </summary>
        readonly Dictionary<string, bool> connections = new Dictionary<string, bool>();

        /// <summary>
        /// Whether a round has started. Once true, teams are permanent.
        /// </summary>
        bool gameStarted = false;

        /// <summary>
        /// High-level phase the game is currently in. Tracked so a player who
        /// (re)connects can be caught up to the right screen even if they missed
        /// the broadcast that advanced the phase (e.g. reconnecting during the
        /// transition into Final Jeffpardy).
        /// </summary>
        private enum GamePhase
        {
            Lobby,
            Round,
            FinalJeffpardyWager,
            FinalJeffpardyClue,
            FinalJeffpardyEnded,
            GameOver,
        }

        GamePhase currentPhase = GamePhase.Lobby;

        /// <summary>
        /// The most recent scores broadcast for the game. Sent to a reconnecting
        /// player so Final Jeffpardy max wagers and the end screen are correct.
        /// </summary>
        Dictionary<string, int> latestScores = new Dictionary<string, int>();

        GameRound latestRound;
        CategoryClue latestClue;
        bool isShowingClue = false;

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
        /// Whether the buzzer is currently open for buzz-ins. Buzzes are only
        /// accepted while this is true. It is closed once a winner is assigned
        /// or the host moves on (resets the buzzer), so a late buzz arriving
        /// after the host has shown the answer is ignored.
        /// </summary>
        bool isBuzzerActive = false;

        /// <summary>
        /// Monotonically increasing token identifying the current buzzer window.
        /// Incremented every time the buzzer is activated or reset so that a
        /// winner computed for an old window can be detected and dropped instead
        /// of being broadcast after the host has already moved on.
        /// </summary>
        int buzzerGeneration = 0;

        /// <summary>
        /// All buzz attempts for the current buzzer window, sorted by time when sent.
        /// </summary>
        readonly List<(Player Player, int TimeInMilliseconds)> buzzerAttempts = new List<(Player, int)>();

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
            await this.SendHostPhaseSyncAsync(connectionId);
        }

        public async Task ConnectPlayerLobbyAsync(string connectionId)
        {
            await this.AddConnectionToGame(connectionId);
            await this.SendUserListAsync(connectionId);
        }

        public async Task ConnectPlayerAsync(string connectionId, string team, string name, string playerId = null)
        {
            await this.AddConnectionToGame(connectionId);

            // Fall back to the connection id as the identity for older clients
            // that don't supply a durable PlayerId.
            if (string.IsNullOrEmpty(playerId))
            {
                playerId = connectionId;
            }

            lock (_lock)
            {
                this.connectionToPlayerId[connectionId] = playerId;

                if (this.players.TryGetValue(playerId, out Player existing))
                {
                    // Reconnect: reclaim the existing slot, updating the live
                    // connection id (and name/team in case they changed).
                    existing.ConnectionId = connectionId;
                    existing.Team = team;
                    existing.Name = name;
                }
                else
                {
                    this.players.Add(playerId, new Player()
                    {
                        PlayerId = playerId,
                        ConnectionId = connectionId,
                        Team = team,
                        Name = name
                    });
                }

                // If the game has already started, lock in this team as permanent too
                if (this.gameStarted)
                {
                    this.permanentTeamNames.Add(team);
                }
            }

            await this.SendUserListToAllClientsAsync();

            // Catch the (re)connecting player up to the current phase in case they
            // missed the broadcast that advanced it (e.g. they were disconnected
            // during the transition into Final Jeffpardy and would otherwise be
            // stuck on the buzzer screen).
            await this.SendPhaseSyncAsync(connectionId);
        }

        /// <summary>
        /// Replays the message(s) needed to move a single (re)connecting player's
        /// UI to the game's current phase. Uses the same client events the normal
        /// flow uses, so the player lands exactly where everyone else already is.
        /// </summary>
        private async Task SendPhaseSyncAsync(string connectionId)
        {
            GamePhase phase;
            Dictionary<string, int> scores;
            lock (_lock)
            {
                phase = this.currentPhase;
                scores = new Dictionary<string, int>(this.latestScores);
            }

            var client = gameHubContext.Clients.Client(connectionId);
            switch (phase)
            {
                case GamePhase.FinalJeffpardyWager:
                    await client.SendAsync("startFinalJeffpardy", scores);
                    break;
                case GamePhase.FinalJeffpardyClue:
                    await client.SendAsync("startFinalJeffpardy", scores);
                    await client.SendAsync("showFinalJeffpardyClue");
                    break;
                case GamePhase.FinalJeffpardyEnded:
                    await client.SendAsync("startFinalJeffpardy", scores);
                    await client.SendAsync("showFinalJeffpardyClue");
                    await client.SendAsync("endFinalJeffpardy");
                    break;
                case GamePhase.GameOver:
                    await client.SendAsync("endGame", scores);
                    break;
                default:
                    // Lobby / Round: the player's existing screen (front page,
                    // lobby, or buzzer) is already correct; nothing to replay.
                    break;
            }
        }

        private async Task SendHostPhaseSyncAsync(string connectionId)
        {
            GameRound round;
            CategoryClue clue;
            bool showingClue;
            lock (_lock)
            {
                round = this.latestRound;
                clue = this.latestClue;
                showingClue = this.isShowingClue;
            }

            var client = gameHubContext.Clients.Client(connectionId);
            if (showingClue && clue != null)
            {
                await client.SendAsync("showClue", clue);
            }
            else if (round != null)
            {
                await client.SendAsync("startRound", round);
            }
        }

        /// <summary>
        /// Resolves the durable PlayerId for an incoming message. Prefers an
        /// explicit PlayerId sent by the client, then the connection→player map,
        /// then the connection id itself. Caller must hold <see cref="_lock"/>.
        /// </summary>
        private Player ResolvePlayer(string connectionId, string playerId)
        {
            if (!string.IsNullOrEmpty(playerId) && this.players.TryGetValue(playerId, out Player byPlayerId))
            {
                // Keep the live connection id fresh so the player object stays current.
                byPlayerId.ConnectionId = connectionId;
                return byPlayerId;
            }

            if (this.connectionToPlayerId.TryGetValue(connectionId, out string mappedPlayerId) &&
                this.players.TryGetValue(mappedPlayerId, out Player byConnection))
            {
                return byConnection;
            }

            this.players.TryGetValue(connectionId, out Player byRawConnection);
            return byRawConnection;
        }

        public async Task RemoveUserAsync(string connectionId)
        {
            lock (_lock)
            {
                this.connections.Remove(connectionId);

                // Drop the connection→player mapping, but keep the player's
                // durable slot so a reconnect (with the same PlayerId) reclaims
                // it and in-flight buzzes/answers are still attributed. Only
                // remove the slot if this connection still owns it (i.e. the
                // player hasn't already reconnected under a new connection).
                if (this.connectionToPlayerId.TryGetValue(connectionId, out string playerId))
                {
                    this.connectionToPlayerId.Remove(connectionId);

                    if (this.players.TryGetValue(playerId, out Player player) &&
                        player.ConnectionId == connectionId)
                    {
                        // The player has gone offline without reconnecting yet.
                        // Leave the slot in place so they can reclaim it; just
                        // refresh the user list.
                    }
                }
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
                this.buzzerAttempts.Clear();
                this.buzzerWindowTimer.Stop();
                this.isBuzzerActive = false;
                this.buzzerGeneration++;
            }
            await gameHubContext.Clients.Group(this.GameCode).SendAsync("resetBuzzer");
        }

        public async Task ActivateBuzzerAsync()
        {
            lock (_lock)
            {
                this.winningBuzzerUser = null;
                this.winningBuzzerTimeInMilliseconds = int.MaxValue;
                this.buzzerAttempts.Clear();
                this.buzzerWindowTimer.Stop();
                this.isBuzzerActive = true;
                this.buzzerGeneration++;
            }
            await gameHubContext.Clients.Group(this.GameCode).SendAsync("activateBuzzer");
        }

        public async Task AssignWinnerAsync()
        {
            Player winner;
            int winningTime;
            object[] topBuzzers;
            int generation;
            lock (_lock)
            {
                this.buzzerWindowTimer.Stop();

                if (this.winningBuzzerUser == null)
                {
                    return;
                }

                // If the buzzer has already been closed (the host moved on or
                // reset it), don't broadcast a stale winner.
                if (!this.isBuzzerActive)
                {
                    return;
                }

                // Close the buzzer once a winner is assigned so late buzzes
                // (or buzzes after the host moves on) are not accepted.
                this.isBuzzerActive = false;
                generation = this.buzzerGeneration;

                this.buzzerWinnerTeams.Add(this.winningBuzzerUser.Team);
                winner = this.winningBuzzerUser;
                winningTime = this.winningBuzzerTimeInMilliseconds;

                // Build top 3 buzzer attempts sorted by time
                topBuzzers = this.buzzerAttempts
                    .OrderBy(a => a.TimeInMilliseconds)
                    .Take(3)
                    .Select(a => (object)new { player = a.Player, time = a.TimeInMilliseconds })
                    .ToArray();
            }

            // The winner was computed above and the lock released. If the host
            // reset or re-activated the buzzer in the meantime, the generation
            // will have changed; dropping the broadcast prevents a stale
            // "assignWinner" from arriving after "resetBuzzer" and leaving the
            // host stuck showing a buzzed-in player after the answer is shown.
            lock (_lock)
            {
                if (generation != this.buzzerGeneration)
                {
                    return;
                }
            }

            await gameHubContext.Clients.Group(this.GameCode).SendAsync("assignWinner", winner, winningTime, topBuzzers);
        }

        public void BuzzIn(string connectionId, int timeInMilliseconds, int handicapInMilliseconds, string playerId = null)
        {
            lock (_lock)
            {
                Player buzzerUser = this.ResolvePlayer(connectionId, playerId);
                if (buzzerUser == null)
                {
                    return;
                }

                // Ignore buzzes once the buzzer has closed (winner assigned or the
                // host moved on and reset the buzzer). Without this, a late buzz
                // would restart the buzzer window and broadcast a stale winner that
                // leaves players stuck showing "buzzed in".
                if (!this.isBuzzerActive)
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

                this.buzzerAttempts.Add((buzzerUser, timeInMilliseconds));
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

                this.currentPhase = GamePhase.Round;
                this.latestRound = round;
                this.latestClue = null;
                this.isShowingClue = false;

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
            lock (_lock)
            {
                this.latestClue = clue;
                this.isShowingClue = true;
            }
            await gameHubContext.Clients.Groups(this.hostGroupName).SendAsync("showClue", clue);
        }

        public async Task BroadcastScoresAsync(Dictionary<string, int> scores)
        {
            lock (_lock)
            {
                this.latestScores = new Dictionary<string, int>(scores);
            }
            await gameHubContext.Clients.Group(this.GameCode).SendAsync("broadcastScores", scores);
        }

        public async Task EndGameAsync(Dictionary<string, int> scores)
        {
            lock (_lock)
            {
                this.currentPhase = GamePhase.GameOver;
                this.latestScores = new Dictionary<string, int>(scores);
            }
            await gameHubContext.Clients.Group(this.GameCode).SendAsync("endGame", scores);
        }

        public async Task StartFinalJeffpardyAsync(Dictionary<string, int> scores)
        {
            lock (_lock)
            {
                this.currentPhase = GamePhase.FinalJeffpardyWager;
                this.latestScores = new Dictionary<string, int>(scores);
            }
            await gameHubContext.Clients.Group(this.GameCode).SendAsync("startFinalJeffpardy", scores);
        }

        public async Task<bool> SubmitWagerAsync(string connectionId, int wager, string playerId = null)
        {
            Player player;
            lock (_lock)
            {
                player = this.ResolvePlayer(connectionId, playerId);
                if (player == null)
                {
                    return false;
                }
            }

            await gameHubContext.Clients.Group(this.hostGroupName).SendAsync("submitWager",
                                                                                player, 
                                                                                wager);

            // Notify all players that this player locked in their wager
            await gameHubContext.Clients.Group(this.GameCode).SendAsync("wagerLockedIn", player.ConnectionId);
            return true;
        }

        public async Task<bool> SubmitAnswerAsync(string connectionId, string answer, int timeInMilliseconds, string playerId = null)
        {
            Player player;
            lock (_lock)
            {
                player = this.ResolvePlayer(connectionId, playerId);
                if (player == null)
                {
                    return false;
                }
            }

            await gameHubContext.Clients.Group(this.hostGroupName).SendAsync("submitAnswer",
                                                                                player,
                                                                                answer,
                                                                                timeInMilliseconds);
            return true;
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
            lock (_lock)
            {
                this.currentPhase = GamePhase.FinalJeffpardyClue;
            }
            await gameHubContext.Clients.Group(this.GameCode).SendAsync("showFinalJeffpardyClue");
        }

        public async Task EndFinalJeffpardyAsync()
        {
            lock (_lock)
            {
                this.currentPhase = GamePhase.FinalJeffpardyEnded;
            }
            await gameHubContext.Clients.Group(this.GameCode).SendAsync("endFinalJeffpardy");
        }

        public void Dispose()
        {
            buzzerWindowTimer.Stop();
            buzzerWindowTimer.Dispose();
        }

    }

}
