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
        Buzzer b;

        public BuzzerHub(Buzzer b)
        {
            this.b = b;
        }

        public override Task OnConnectedAsync()
        {
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception exception)
        {
            this.b.RemoveUser(Context.ConnectionId);
            return base.OnDisconnectedAsync(exception);
        }

        public void Connect(string team, string name)
        {
            this.b.AddUser(Context.ConnectionId, team, name);
        }

        public void ResetBuzzer()
        {
            this.b.ResetBuzzer();
        }

        public void ActivateBuzzer()
        {
            this.b.ActivateBuzzer();
        }

        public void BuzzIn(int timeInMillisenconds)
        {
            b.BuzzIn(Context.ConnectionId, timeInMillisenconds);
        }

    }
}
