using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Timers;
using Microsoft.AspNetCore.SignalR;

namespace Jeopardy.Hubs
{
    public class BuzzerUser
    {
        public string Team { get; set; }
        public string Name { get; set; }
    }

    public static class ConnectedUser
    {
        public static List<string> Ids = new List<string>();
        public static List<UserDetail> Names = new List<UserDetail>();
    }

    public class UserDetail
    {
        public string Name { get; set; }
        public string ConnectionId { get; set; }
    }

    public class BuzzerHub : Hub
    {
        Buzzer b;

        public BuzzerHub(Buzzer b)
        {
            this.b = b;
        }

        public override Task OnConnectedAsync()
        {
            ConnectedUser.Ids.Add(Context.ConnectionId);
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception exception)
        {
            ConnectedUser.Ids.Remove(Context.ConnectionId);

            var item = ConnectedUser.Names.FirstOrDefault(x => x.ConnectionId == Context.ConnectionId);
            if (item != null)
            {
                ConnectedUser.Names.Remove(item);

                var id = Context.ConnectionId;
                this.Clients.All.SendAsync("updateUsers", ConnectedUser.Names);

            }


            return base.OnDisconnectedAsync(exception);
        }

        public async Task Connect(string userName)
        {

            var id = Context.ConnectionId;

            if (ConnectedUser.Names.Count(x => x.ConnectionId == id) == 0)
            {

                ConnectedUser.Names.Add(new UserDetail { ConnectionId = id, Name = userName });

                // send to caller
                // Clients.Caller.SendAsync();

                // send to all except caller client
                //Clients.AllExcept(id).onNewUserConnected(id, userName);

                await this.Clients.All.SendAsync("updateUsers", ConnectedUser.Names);

            }

        }

        public void ResetBuzzer()
        {
            this.b.ResetBuzzer();
        }

        public void ActivateBuzzer()
        {
            this.b.ActivateBuzzer();
        }


        public void BuzzIn(string team, string name, int timeInMillisenconds)
        {
            b.BuzzIn(team, name, timeInMillisenconds);
        }

        //return list of all active connections
        public List<string> GetAllActiveConnections()
        {
            return ConnectedUser.Ids;
        }

    }
}
