using Jeffpardy.Hubs;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Concurrent;
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

        readonly ConcurrentDictionary<string, string> connectionToGameDictionary = new ConcurrentDictionary<string, string>();
        readonly ConcurrentDictionary<string, Game> games = new ConcurrentDictionary<string, Game>();

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
            if (game == null) return;

            connectionToGameDictionary[connectionId] = gameCode;
            
            await game.ConnectPlayerLobbyAsync(connectionId);
        }

        public async Task ConnectPlayerAsync(string connectionId, string gameCode, string team, string name)
        {
            Game game = this.GetGame(gameCode);
            if (game == null) return;

            connectionToGameDictionary[connectionId] = gameCode;
            
            await game.ConnectPlayerAsync(connectionId, team, name);
        }

        public async Task RemoveUserAsync(string connectionId)
        {
            if (!connectionToGameDictionary.TryRemove(connectionId, out string gameCode))
            {
                return;
            }

            Game game = this.GetGame(gameCode);
            if (game != null)
            {
                await game.RemoveUserAsync(connectionId);
                if (game.IsEmptyGame)
                {
                    if (this.games.TryRemove(gameCode, out var removedGame))
                    {
                        removedGame.Dispose();
                    }
                }
            }
        }

        public async Task ResetBuzzerAsync(string gameCode)
        {
            Game game = this.GetGame(gameCode);
            if (game == null) return;
            await game.ResetBuzzerAsync();
        }

        public async Task ActivateBuzzerAsync(string gameCode)
        {
            Game game = this.GetGame(gameCode);
            if (game == null) return;
            await game.ActivateBuzzerAsync();
        }

        public void BuzzIn(string gameCode, string connectionId, int timeInMilliseconds, int handicapInMilliseconds)
        {
            Game game = this.GetGame(gameCode);
            if (game == null) return;
            game.BuzzIn(connectionId, timeInMilliseconds, handicapInMilliseconds);
        }
        public async Task StartRoundAsync(string gameCode, GameRound round)
        {
            Game game = this.GetGame(gameCode);
            if (game == null) return;
            await game.StartRoundAsync(round);
        }

        public async Task ShowClueAsync(string gameCode, CategoryClue clue)
        {
            Game game = this.GetGame(gameCode);
            if (game == null) return;
            await game.ShowClueAsync(clue);
        }

        public async Task BroadcastScoresAsync(string gameCode, Dictionary<string, int> scores)
        {
            Game game = this.GetGame(gameCode);
            if (game == null) return;
            await game.BroadcastScoresAsync(scores);
        }

        public async Task StartFinalJeffpardyAsync(string gameCode, Dictionary<string, int> scores)
        {
            Game game = this.GetGame(gameCode);
            if (game == null) return;

            // TODO: Send in max bets
            await game.StartFinalJeffpardyAsync(scores);
        }

        public async Task SubmitWagerAsync(string gameCode, string connectionId, int wager)
        {
            Game game = this.GetGame(gameCode);
            if (game == null) return;
            await game.SubmitWagerAsync(connectionId, wager);
        }

        public async Task SubmitAnswerAsync(string gameCode, string connectionId, string answer, int timeInMilliseconds)
        {
            Game game = this.GetGame(gameCode);
            if (game == null) return;
            await game.SubmitAnswerAsync(connectionId, answer, timeInMilliseconds);
        }

        public async Task ShowFinalJeffpardyClueAsync(string gameCode)
        {
            Game game = this.GetGame(gameCode);
            if (game == null) return;
            await game.ShowFinalJeffpardyClueAsync();
        }

        public async Task EndFinalJeffpardyAsync(string gameCode)
        {
            Game game = this.GetGame(gameCode);
            if (game == null) return;
            await game.EndFinalJeffpardyAsync();
        }


        private Game GetGame(string gameCode)
        {
            gameCode = gameCode.ToUpperInvariant();

            games.TryGetValue(gameCode, out Game game);

            return game;
        }

        private Game GetGameAsHost(string gameCode, string hostCode)
        {
            gameCode = gameCode.ToUpperInvariant();
            hostCode = hostCode.ToUpperInvariant();

            var game = games.GetOrAdd(gameCode, code => new Game(this.gameHubContext, code, hostCode));

            if (game.HostCode != hostCode)
            {
                throw new ArgumentException("Incorrect HostCode");
            }

            return game;
        }
    }
}
