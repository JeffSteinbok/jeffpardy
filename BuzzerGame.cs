using Jeffpardy.Hubs;
using System;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Timers;

namespace Jeffpardy
{
    class BuzzerGame
    {
        public string GameCode { get; private set; }

        private readonly IHubContext<BuzzerHub> buzzerHubContext;

        readonly Dictionary<string, BuzzerUser> buzzerUsers = new Dictionary<string, BuzzerUser>();

        int winningBuzzerTimeInMilliseconds = int.MaxValue;
        BuzzerUser winningBuzzerUser;

        /// <summary>
        /// List of all winners for this session.  A team can win only once per session.
        /// </summary>
        readonly List<string> buzzerWinnerTeams = new List<string>();

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

        public bool IsEmptyGame => this.buzzerUsers.Count == 0;

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
                this.buzzerWinnerTeams.Clear();
                this.winningBuzzerUser = null;
                this.winningBuzzerTimeInMilliseconds = int.MaxValue;
                this.buzzerWindowTimer.Stop();
            }
            await buzzerHubContext.Clients.Group(this.GameCode).SendAsync("resetBuzzer");
        }

        public async Task ActivateBuzzerAsync()
        {
            lock (this)
            {
                this.winningBuzzerUser = null;
                this.winningBuzzerTimeInMilliseconds = int.MaxValue;
                this.buzzerWindowTimer.Stop();
            }
            await buzzerHubContext.Clients.Group(this.GameCode).SendAsync("activateBuzzer");
        }

        public async Task AssignWinnerAsync()
        {
            lock (this)
            {
                this.buzzerWindowTimer.Stop();
                this.buzzerWinnerTeams.Add(this.winningBuzzerUser.Team);
            }
            await buzzerHubContext.Clients.Group(this.GameCode).SendAsync("assignWinner", this.winningBuzzerUser);

        }

        public void BuzzIn(string connectionId, int timeInMilliseconds)
        {
            lock (this)
            {
                BuzzerUser buzzerUser = buzzerUsers[connectionId];
                if (this.buzzerWinnerTeams.Contains(buzzerUser.Team))
                {
                    // This team already won this session and isn't eligible; ignore it.
                    return;

                }
                if (!this.buzzerWindowTimer.Enabled)
                {
                    buzzerWindowTimer.Start();
                }

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

}
