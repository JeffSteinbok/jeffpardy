using Jeffpardy.Hubs;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Jeffpardy
{
    /// <summary>
    /// Singleton cache of games; also holds the singleton context for the SignalR Hub.
    /// Alternative to just storing the games in the SignalR hub itself.
    /// </summary>
    public class GameCache
    {
        // Singleton instance
        private readonly IHubContext<GameHub> gameHubContext;

        Dictionary<string, string> connectionToGameDictionary = new Dictionary<string, string>();
        Dictionary<string, Game> games = new Dictionary<string, Game>();

        public GameCache(IHubContext<GameHub> gameHubContext)
        {
            this.gameHubContext = gameHubContext;
        }

        public async Task ConnectHostAsync(string connectionId, string gameCode, string hostCode)
        {
            Game game = this.GetGameAsHost(gameCode, hostCode);

            connectionToGameDictionary[connectionId] = gameCode;
            
            await game.ConnectHostAsync(connectionId);
        }

        public async Task ConnectPlayerLobbyAsync(string connectionId, string gameCode)
        {
            Game game = this.GetGame(gameCode);

            connectionToGameDictionary[connectionId] = gameCode;
            
            await game.ConnectPlayerLobbyAsync(connectionId);
        }

        public async Task ConnectPlayerAsync(string connectionId, string gameCode, string team, string name)
        {
            Game game = this.GetGame(gameCode);

            connectionToGameDictionary[connectionId] = gameCode;
            
            await game.ConnectPlayerAsync(connectionId, team, name);
        }

        public async Task RemoveUserAsync(string connectionId)
        {
            string gameCode = connectionToGameDictionary[connectionId];
            Game game = this.GetGame(gameCode);

            await game.RemoveUserAsync(connectionId);
            connectionToGameDictionary.Remove(connectionId);
            if (game.IsEmptyGame)
            {
                this.games.Remove(gameCode);
            }
        }

        public async Task ResetBuzzerAsync(string gameCode)
        {
            Game game = this.GetGame(gameCode);
            await game.ResetBuzzerAsync();
        }

        public async Task ActivateBuzzerAsync(string gameCode)
        {
            Game game = this.GetGame(gameCode);
            await game.ActivateBuzzerAsync();
        }

        public void BuzzIn(string gameCode, string connectionId, int timeInMilliseconds, int handicapInMilliseconds)
        {
            Game game = this.GetGame(gameCode);
            game.BuzzIn(connectionId, timeInMilliseconds, handicapInMilliseconds);
        }
        public async Task StartRoundAsync(string gameCode, GameRound round)
        {
            Game game = this.GetGame(gameCode);
            await game.StartRoundAsync(round);
        }

        public async Task ShowClueAsync(string gameCode, CategoryClue clue)
        {
            Game game = this.GetGame(gameCode);
            await game.ShowClueAsync(clue);
        }

        public async Task StartFinalJeffpardyAsync(string gameCode, Dictionary<string, int> scores)
        {
            Game game = this.GetGame(gameCode);

            // TODO: Send in max bets
            await game.StartFinalJeffpardyAsync(scores);
        }

        public async Task SubmitWagerAsync(string gameCode, string connectionId, int wager)
        {
            Game game = this.GetGame(gameCode);
            await game.SubmitWagerAsync(connectionId, wager);
        }

        public async Task SubmitAnswerAsync(string gameCode, string connectionId, string answer, int timeInMilliseconds)
        {
            Game game = this.GetGame(gameCode);
            await game.SubmitAnswerAsync(connectionId, answer, timeInMilliseconds);
        }

        public async Task ShowFinalJeffpardyClueAsync(string gameCode)
        {
            Game game = this.GetGame(gameCode);
            await game.ShowFinalJeffpardyClueAsync();
        }

        public async Task EndFinalJeffpardyAsync(string gameCode)
        {
            Game game = this.GetGame(gameCode);
            await game.EndFinalJeffpardyAsync();
        }


        private Game GetGame(string gameCode)
        {
            gameCode = gameCode.ToUpperInvariant();

            Game game = null;

            if (games.ContainsKey(gameCode))
            {
                game = games[gameCode];
            }

            return game;
        }

        private Game GetGameAsHost(string gameCode, string hostCode)
        {
            gameCode = gameCode.ToUpperInvariant();
            hostCode = hostCode.ToUpperInvariant();

            Game game = null;

            if (games.ContainsKey(gameCode))
            {
                if (games[gameCode].HostCode == hostCode)
                {
                    game = games[gameCode];
                }
                else
                {
                    throw new ArgumentException("Incorrect HostCode");
                }
            }
            else
            {
                game = new Game(this.gameHubContext, gameCode, hostCode);
                lock (this)
                {
                    games[gameCode] = game;
                }
            }

            return game;
        }
    }
}
