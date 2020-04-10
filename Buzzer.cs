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
