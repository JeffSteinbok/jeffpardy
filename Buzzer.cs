using Jeffpardy.Hubs;
using System;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Timers;
using Microsoft.Extensions.Hosting;

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

        public async Task ConnectHostAsync(string connectionId, string gameCode, string hostCode)
        {
            BuzzerGame buzzerGame = this.GetBuzzerGameAsHost(gameCode, hostCode);

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

        public async Task ShowClueAsync(string gameCode, CategoryClue clue)
        {
            BuzzerGame buzzerGame = this.GetBuzzerGame(gameCode);
            await buzzerGame.ShowClueAsync(clue);
        }

        public async Task StartFinalJeffpardyAsync(string gameCode, Dictionary<string, int> scores)
        {
            BuzzerGame buzzerGame = this.GetBuzzerGame(gameCode);

            // TODO: Send in max bets
            await buzzerGame.StartFinalJeffpardyAsync(scores);
        }

        public async Task SubmitWagerAsync(string gameCode, string connectionId, int wager)
        {
            BuzzerGame buzzerGame = this.GetBuzzerGame(gameCode);
            await buzzerGame.SubmitWagerAsync(connectionId, wager);
        }

        public async Task SubmitAnswerAsync(string gameCode, string connectionId, string answer, int timeInMilliseconds)
        {
            BuzzerGame buzzerGame = this.GetBuzzerGame(gameCode);
            await buzzerGame.SubmitAnswerAsync(connectionId, answer, timeInMilliseconds);
        }

        public async Task ShowFinalJeffpardyClueAsync(string gameCode)
        {
            BuzzerGame buzzerGame = this.GetBuzzerGame(gameCode);
            await buzzerGame.ShowFinalJeffpardyClueAsync();
        }

        public async Task EndFinalJeffpardyAsync(string gameCode)
        {
            BuzzerGame buzzerGame = this.GetBuzzerGame(gameCode);
            await buzzerGame.EndFinalJeffpardyAsync();
        }


        private BuzzerGame GetBuzzerGame(string gameCode)
        {
            gameCode = gameCode.ToUpperInvariant();

            BuzzerGame buzzerGame = null;

            if (buzzerGames.ContainsKey(gameCode))
            {
                buzzerGame = buzzerGames[gameCode];
            }

            return buzzerGame;
        }

        private BuzzerGame GetBuzzerGameAsHost(string gameCode, string hostCode)
        {
            gameCode = gameCode.ToUpperInvariant();
            hostCode = hostCode.ToUpperInvariant();

            BuzzerGame buzzerGame = null;

            if (buzzerGames.ContainsKey(gameCode))
            {
                if (buzzerGames[gameCode].HostCode == hostCode)
                {
                    buzzerGame = buzzerGames[gameCode];
                }
                else
                {
                    throw new ArgumentException("Incorrect HostCode");
                }
            }
            else
            {
                buzzerGame = new BuzzerGame(this.buzzerHubContext, gameCode, hostCode);
                lock (this)
                {
                    buzzerGames[gameCode] = buzzerGame;
                }
            }

            return buzzerGame;
        }
    }
}
