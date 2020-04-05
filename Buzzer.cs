using Jeopardy.Hubs;
using System;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Timers;

namespace Jeopardy
{ 
    public class BuzzerUser
    {
        public string Team { get; set; }
        public string Name { get; set; }
        public string ConnectionId { get; set; }
    }

    public class Buzzer
    {
        // Singleton instance
        private IHubContext<BuzzerHub> BuzzerHubContext;
        readonly Timer buzzerWindowTimer;

        int winningBuzzerTimeInMilliseconds = int.MaxValue;
        BuzzerUser winningBuzzerUser;

        Dictionary<string, BuzzerUser> buzzerUsers = new Dictionary<string, BuzzerUser>();

        Dictionary<BuzzerUser, int> buzzerActivations = new Dictionary<BuzzerUser, int>();

        public Buzzer(IHubContext<BuzzerHub> buzzerHubContext)
        {
            this.BuzzerHubContext = buzzerHubContext;
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
            this.buzzerUsers.Add(connectionId, new BuzzerUser()
            {
                ConnectionId = connectionId,
                Team = team,
                Name = name
            });

            var buzzerTeams = this.buzzerUsers.Values
                                                        .GroupBy(x => x.Team)
                                                        .OrderBy(p => p.Key.ToString())
                                                        .ToDictionary(x => x.Key, x => x.ToList().OrderBy(o => o.Name));

            await BuzzerHubContext.Clients.All.SendAsync("updateUsers", this.buzzerUsers.Values.ToList());
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
            await BuzzerHubContext.Clients.All.SendAsync("resetBuzzer");
        }

        public async Task ActivateBuzzerAsync()
        {
            await BuzzerHubContext.Clients.All.SendAsync("activateBuzzer");
        }

        public async Task AssignWinnerAsync()
        {
            lock (this)
            {
                this.buzzerWindowTimer.Stop();
            }
            await BuzzerHubContext.Clients.All.SendAsync("assignWinner", this.winningBuzzerUser);

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
            await BuzzerHubContext.Clients.Client(connectionId).SendAsync("updateUsers", this.buzzerUsers.Values.ToList());
        }

        private async Task SendUserListToAllClientsAsync()
        {
            await BuzzerHubContext.Clients.All.SendAsync("updateUsers", this.buzzerUsers.Values.ToList());
        }
    }
}
