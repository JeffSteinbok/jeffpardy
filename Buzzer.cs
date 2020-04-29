using Jeffpardy.Hubs;
using System;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Timers;

namespace Jeffpardy
{
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
            
            await buzzerGame.ConnectHostAsync(connectionId);
        }

        public async Task ConnectPlayerLobbyAsync(string connectionId, string gameCode)
        {
            BuzzerGame buzzerGame = this.GetBuzzerGame(gameCode);

            connectionToGameDictionary[connectionId] = gameCode;
            
            await buzzerGame.ConnectPlayerLobbyAsync(connectionId);
        }

        public async Task ConnectPlayerAsync(string connectionId, string gameCode, string team, string name)
        {
            BuzzerGame buzzerGame = this.GetBuzzerGame(gameCode);

            connectionToGameDictionary[connectionId] = gameCode;
            
            await buzzerGame.ConnectPlayerAsync(connectionId, team, name);
        }

        public async Task RemoveUserAsync(string connectionId)
        {
            string gameCode = connectionToGameDictionary[connectionId];
            BuzzerGame buzzerGame = this.GetBuzzerGame(gameCode);

            await buzzerGame.RemoveUserAsync(connectionId);
            connectionToGameDictionary.Remove(connectionId);
            if (buzzerGame.IsEmptyGame)
            {
                this.buzzerGames.Remove(gameCode);
            }
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

        public async Task SubmitWagerAsync(string gameCode, string connectionId, int wager)
        {
            BuzzerGame buzzerGame = this.GetBuzzerGame(gameCode);
            await buzzerGame.SubmitWagerAsync(connectionId, wager);
        }

        public async Task SubmitAnswerAsync(string gameCode, string connectionId, string answer)
        {
            BuzzerGame buzzerGame = this.GetBuzzerGame(gameCode);
            await buzzerGame.SubmitAnswerAsync(connectionId, answer);
        }


        private BuzzerGame GetBuzzerGame(string gameCode)
        {
            gameCode = gameCode.ToUpperInvariant();

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
