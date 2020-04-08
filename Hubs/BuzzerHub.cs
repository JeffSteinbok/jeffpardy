using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Timers;
using Microsoft.AspNetCore.SignalR;
using Jeffpardy;

namespace Jeffpardy.Hubs
{
    public class BuzzerHub : Hub
    {
        Buzzer buzzer;

        public BuzzerHub(Buzzer buzzer)
        {
            this.buzzer = buzzer;
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            await this.buzzer.RemoveUserAsync(Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }

        public async void ConnectHost(string gameCode)
        {
            await this.buzzer.ConnectHostAsync(Context.ConnectionId, gameCode);
        }

        public async void ConnectUser(string gameCode, string team, string name)
        {
            await this.buzzer.ConnectUserAsync(Context.ConnectionId, gameCode, team, name);
        }

        public async void ResetBuzzer(string gameCode)
        {
            await this.buzzer.ResetBuzzerAsync(gameCode);
        }

        public async void ActivateBuzzer(string gameCode)
        {
            await this.buzzer.ActivateBuzzerAsync(gameCode);
        }

        public void BuzzIn(string gameCode, int timeInMillisenconds)
        {
            buzzer.BuzzIn(gameCode, Context.ConnectionId, timeInMillisenconds);
        }

    }
}
