using Jeffpardy.Hubs;
using System;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Timers;

namespace Jeffpardy
{
    public class BuzzerUser
    {
        public string Team { get; set; }
        public string Name { get; set; }
        public string ConnectionId { get; set; }
    }

    class BuzzerGame
    {
        public string GameCode { get; private set; }

        private readonly IHubContext<BuzzerHub> buzzerHubContext;

        readonly Dictionary<string, BuzzerUser> buzzerUsers = new Dictionary<string, BuzzerUser>();

        readonly Dictionary<BuzzerUser, int> buzzerActivations = new Dictionary<BuzzerUser, int>();

        int winningBuzzerTimeInMilliseconds = int.MaxValue;
        BuzzerUser winningBuzzerUser;

        readonly Timer buzzerWindowTimer;

        public BuzzerGame(IHubContext<BuzzerHub> buzzerHubContext, string gameCode)
        {
            this.GameCode = gameCode;
            this.buzzerHubContext = buzzerHubContext;

            this.buzzerWindowTimer = new Timer(500);
            this.buzzerWindowTimer.Elapsed += async (sender, args) =>
            {
                await this.AssignWinnerAsync();
            };

        }

        public async Task ConnectAsync(string connectionId)
        {
            await this.SendUserListAsync(connectionId);
        }

        public async Task ConnectUserAsync(string connectionId, string team, string name)
        {
            lock (this)
            {
                this.buzzerUsers.Add(connectionId, new BuzzerUser()
                {
                    ConnectionId = connectionId,
                    Team = team,
                    Name = name
                });
            }

            var buzzerTeams = this.buzzerUsers.Values
                                                        .GroupBy(x => x.Team)
                                                        .OrderBy(p => p.Key.ToString())
                                                        .ToDictionary(x => x.Key, x => x.ToList().OrderBy(o => o.Name));

            await this.buzzerHubContext.Clients.Group(this.GameCode).SendAsync("updateUsers", this.buzzerUsers.Values.ToList());
        }

        public async Task RemoveUserAsync(string connectionId)
        {
            if (this.buzzerUsers.ContainsKey(connectionId))
            {
                var item = this.buzzerUsers[connectionId];

                this.buzzerUsers.Remove(item.ConnectionId);

                var buzzerTeams = this.buzzerUsers.Values
                                                            .GroupBy(x => x.Team)
                                                            .OrderBy(p => p.Key.ToString())
                                                            .ToDictionary(x => x.Key, x => x.ToList().OrderBy(o => o.Name));
                await SendUserListToAllClientsAsync();

            }
        }


        public async Task ResetBuzzerAsync()
        {
            lock (this)
            {
                this.buzzerActivations.Clear();
                this.winningBuzzerUser = null;
                this.winningBuzzerTimeInMilliseconds = int.MaxValue;
                this.buzzerWindowTimer.Stop();
            }
            await buzzerHubContext.Clients.Group(this.GameCode).SendAsync("resetBuzzer");
        }

        public async Task ActivateBuzzerAsync()
        {
            await buzzerHubContext.Clients.Group(this.GameCode).SendAsync("activateBuzzer");
        }

        public async Task AssignWinnerAsync()
        {
            lock (this)
            {
                this.buzzerWindowTimer.Stop();
            }
            await buzzerHubContext.Clients.Group(this.GameCode).SendAsync("assignWinner", this.winningBuzzerUser);

        }

        public void BuzzIn(string connectionId, int timeInMilliseconds)
        {
            lock (this)
            {
                if (!this.buzzerWindowTimer.Enabled)
                {
                    buzzerWindowTimer.Start();
                }
                BuzzerUser buzzerUser = buzzerUsers[connectionId];

                this.buzzerActivations.Add(buzzerUser, timeInMilliseconds);
                if (timeInMilliseconds < this.winningBuzzerTimeInMilliseconds)
                {
                    this.winningBuzzerTimeInMilliseconds = timeInMilliseconds;
                    this.winningBuzzerUser = buzzerUser;
                }
            }
        }

        private async Task SendUserListAsync(string connectionId)
        {
            await buzzerHubContext.Clients.Client(connectionId).SendAsync("updateUsers", this.buzzerUsers.Values.ToList());
        }

        private async Task SendUserListToAllClientsAsync()
        {
            await buzzerHubContext.Clients.Groups(this.GameCode).SendAsync("updateUsers", this.buzzerUsers.Values.ToList());
        }
    }

    public class Buzzer
    {
        // Singleton instance
        private readonly IHubContext<BuzzerHub> buzzerHubContext;

        Dictionary<string, string> connectionToGameDictionary = new Dictionary<string, string>();
        Dictionary<string, BuzzerGame> buzzerGames = new Dictionary<string, BuzzerGame>();

        public Buzzer(IHubContext<BuzzerHub> buzzerHubContext)
        {
            this.buzzerHubContext = buzzerHubContext;
        }

        public async Task ConnectHostAsync(string connectionId, string gameCode)
        {
            BuzzerGame buzzerGame = this.GetBuzzerGame(gameCode);

            connectionToGameDictionary[connectionId] = gameCode;
            await this.buzzerHubContext.Groups.AddToGroupAsync(connectionId, gameCode);
            await buzzerGame.ConnectAsync(connectionId);
        }

        public async Task ConnectPlayerLobbyAsync(string connectionId, string gameCode)
        {
            BuzzerGame buzzerGame = this.GetBuzzerGame(gameCode);

            connectionToGameDictionary[connectionId] = gameCode;
            await this.buzzerHubContext.Groups.AddToGroupAsync(connectionId, gameCode);
            await buzzerGame.ConnectAsync(connectionId);
        }

        public async Task ConnectPlayerAsync(string connectionId, string gameCode, string team, string name)
        {
            BuzzerGame buzzerGame = this.GetBuzzerGame(gameCode);

            connectionToGameDictionary[connectionId] = gameCode;
            await this.buzzerHubContext.Groups.AddToGroupAsync(connectionId, gameCode);
            await buzzerGame.ConnectUserAsync(connectionId, team, name);
        }

        public async Task RemoveUserAsync(string connectionId)
        {
            string gameCode = connectionToGameDictionary[connectionId];
            BuzzerGame buzzerGame = this.GetBuzzerGame(gameCode);

            await buzzerGame.RemoveUserAsync(connectionId);
            connectionToGameDictionary.Remove(connectionId);
        }

        public async Task ResetBuzzerAsync(string gameCode)
        {
            BuzzerGame buzzerGame = this.GetBuzzerGame(gameCode);
            await buzzerGame.ResetBuzzerAsync();
        }

        public async Task ActivateBuzzerAsync(string gameCode)
        {
            BuzzerGame buzzerGame = this.GetBuzzerGame(gameCode);
            await buzzerGame.ActivateBuzzerAsync();
        }

        public void BuzzIn(string gameCode, string connectionId, int timeInMilliseconds)
        {
            BuzzerGame buzzerGame = this.GetBuzzerGame(gameCode);
            buzzerGame.BuzzIn(connectionId, timeInMilliseconds);
        }

        private BuzzerGame GetBuzzerGame(string gameCode)
        {
            BuzzerGame buzzerGame = null;

            if (buzzerGames.ContainsKey(gameCode))
            {
                buzzerGame = buzzerGames[gameCode];
            }
            else
            {
                buzzerGame = new BuzzerGame(this.buzzerHubContext, gameCode);
                lock (this)
                {
                    buzzerGames[gameCode] = buzzerGame;
                }
            }

            return buzzerGame;
        }
    }
}
