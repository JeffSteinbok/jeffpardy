using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Timers;
using Microsoft.AspNetCore.SignalR;
using Jeopardy;

namespace Jeopardy.Hubs
{
    public class BuzzerHub : Hub
    {
        Buzzer buzzer;

        public BuzzerHub(Buzzer buzzer)
        {
            this.buzzer = buzzer;
        }

        public override async Task OnConnectedAsync()
        {
            await this.buzzer.ConnectAsync(Context.ConnectionId);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            await this.buzzer.RemoveUserAsync(Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }

        public async void ConnectUser(string team, string name)
        {
            await this.buzzer.ConnectUserAsync(Context.ConnectionId, team, name);
        }

        public async void ResetBuzzer()
        {
            await this.buzzer.ResetBuzzerAsync();
        }

        public async void ActivateBuzzer()
        {
            await this.buzzer.ActivateBuzzerAsync();
        }

        public void BuzzIn(int timeInMillisenconds)
        {
            buzzer.BuzzIn(Context.ConnectionId, timeInMillisenconds);
        }

    }
}
