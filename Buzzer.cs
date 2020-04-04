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

        Timer buzzerWindowTimer;

        SortedList<int, BuzzerUser> buzzerActivations = new SortedList<int, BuzzerUser>();
        
        Dictionary<string, BuzzerUser> buzzerUsers = new Dictionary<string, BuzzerUser>();

        public Buzzer(IHubContext<BuzzerHub> buzzerHubContext)
        {
            this.BuzzerHubContext = buzzerHubContext;

            this.buzzerWindowTimer = new Timer(500);
            this.buzzerWindowTimer.Elapsed += (sender, args) =>
            {
                this.AssignWinner();
            };

        }

        public async void AddUser(string connectionId, string team, string name)
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

        public async void RemoveUser(string connectionId)
        {
            if (this.buzzerUsers.ContainsKey(connectionId))
            {
                var item = this.buzzerUsers[connectionId];

                this.buzzerUsers.Remove(item.ConnectionId);

                var buzzerTeams = this.buzzerUsers.Values
                                                            .GroupBy(x => x.Team)
                                                            .OrderBy(p => p.Key.ToString())
                                                            .ToDictionary(x => x.Key, x => x.ToList().OrderBy(o => o.Name));

                await BuzzerHubContext.Clients.All.SendAsync("updateUsers", this.buzzerUsers.Values.ToList());

            }


        }

        public async Task ResetBuzzer()
        {
            this.buzzerActivations.Clear();
            this.buzzerWindowTimer.Stop();
            await BuzzerHubContext.Clients.All.SendAsync("resetBuzzer");
        }

        public async Task ActivateBuzzer()
        {
            await BuzzerHubContext.Clients.All.SendAsync("activateBuzzer");
        }

        public async Task AssignWinner()
        {
            this.buzzerWindowTimer.Stop();
            await BuzzerHubContext.Clients.All.SendAsync("assignWinner", this.buzzerActivations.First().Value);

        }

        public void BuzzIn(string connectionId, int timeInMillisenconds)
        {

            buzzerWindowTimer.Start();
            this.buzzerActivations.Add(timeInMillisenconds,
                buzzerUsers[connectionId]);
        }
    }
}
