using Jeopardy.Hubs;
using System;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Timers;

namespace Jeopardy
{
    public class Buzzer
    {
        // Singleton instance
        private IHubContext<BuzzerHub> BuzzerHubContext;


        Timer buzzerWindowTimer;

        SortedList<int, BuzzerUser> buzzerActivations = new SortedList<int, BuzzerUser>();

        public Buzzer(IHubContext<BuzzerHub> buzzerHubContext)
        {
            this.BuzzerHubContext = buzzerHubContext;

            this.buzzerWindowTimer = new Timer(500);
            this.buzzerWindowTimer.Elapsed += (sender, args) =>
            {
                this.AssignWinner();
            };

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
            await BuzzerHubContext.Clients.All.SendAsync("assignWinner", this.buzzerActivations.First().Value, "2");

        }

        public void BuzzIn(string team, string name, int timeInMillisenconds)
        {

            buzzerWindowTimer.Start();
            this.buzzerActivations.Add(timeInMillisenconds,
                new BuzzerUser()
                {
                    Team = team,
                    Name = name
                });
        }
    }
}
