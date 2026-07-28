using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Jeffpardy.Hubs
{
    public class GameHub : Hub
    {
        private readonly GameCache gameCache;
        private readonly ILogger<GameHub> logger;

        public GameHub(GameCache gameCache, ILogger<GameHub> logger)
        {
            this.gameCache = gameCache;
            this.logger = logger;
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            await this.gameCache.RemoveUserAsync(Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }

        public async Task ConnectHost(string gameCode, string hostCode)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                if (string.IsNullOrEmpty(hostCode)) { throw new ArgumentNullException("hostCode"); }
                await this.gameCache.ConnectHostAsync(Context.ConnectionId, gameCode, hostCode);
            } catch (Exception ex)
            {
                logger.LogError(ex, "Error in ConnectHost for game {GameCode}", gameCode);
            }
        }
        public async Task ConnectPlayerLobby(string gameCode)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                await this.gameCache.ConnectPlayerLobbyAsync(Context.ConnectionId, gameCode);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in ConnectPlayerLobby for game {GameCode}", gameCode);
            }
        }

        public async Task ConnectPlayer(string gameCode, string team, string name, string playerId = null)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                if (string.IsNullOrEmpty(team)) { throw new ArgumentNullException("team"); }
                if (string.IsNullOrEmpty(name)) { throw new ArgumentNullException("name"); }
                await this.gameCache.ConnectPlayerAsync(Context.ConnectionId, gameCode, team, name, playerId);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in ConnectPlayer for game {GameCode}", gameCode);
            }
        }

        public async Task ResetBuzzer(string gameCode)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                await this.gameCache.ResetBuzzerAsync(gameCode);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in ResetBuzzer for game {GameCode}", gameCode);
            }
        }

        public async Task ActivateBuzzer(string gameCode)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                await this.gameCache.ActivateBuzzerAsync(gameCode);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in ActivateBuzzer for game {GameCode}", gameCode);
            }
        }

        public void BuzzIn(string gameCode, int timeInMillisenconds, int handicapInMilliseconds, string playerId = null)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                gameCache.BuzzIn(gameCode, Context.ConnectionId, timeInMillisenconds, handicapInMilliseconds, playerId);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in BuzzIn for game {GameCode}", gameCode);
            }
        }

        public async Task StartRound(string gameCode, GameRound round)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                await gameCache.StartRoundAsync(gameCode, round);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in StartRound for game {GameCode}", gameCode);
            }
        }

        public async Task ShowClue(string gameCode, CategoryClue clue)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                await gameCache.ShowClueAsync(gameCode, clue);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in ShowClue for game {GameCode}", gameCode);
            }
        }

        public async Task BroadcastScores(string gameCode, Dictionary<string, int> scores)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                await gameCache.BroadcastScoresAsync(gameCode, scores);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in BroadcastScores for game {GameCode}", gameCode);
            }
        }

        public async Task EndGame(string gameCode, Dictionary<string, int> scores)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                await gameCache.EndGameAsync(gameCode, scores);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in EndGame for game {GameCode}", gameCode);
            }
        }

        public async Task StartFinalJeffpardy(string gameCode, Dictionary<string, int> scores)
        {
            try {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                await gameCache.StartFinalJeffpardyAsync(gameCode, scores);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in StartFinalJeffpardy for game {GameCode}", gameCode);
            }
        }

        public async Task SubmitWager(string gameCode, int wagerAmount, string playerId = null)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                bool recorded = await gameCache.SubmitWagerAsync(gameCode, Context.ConnectionId, wagerAmount, playerId);
                if (!recorded)
                {
                    logger.LogWarning(
                        "SubmitWager dropped for game {GameCode}: no player found for connection {ConnectionId} (likely a reconnect changed the connection id).",
                        gameCode, Context.ConnectionId);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in SubmitWager for game {GameCode}", gameCode);
            }
        }

        public async Task SubmitAnswer(string gameCode, string answer, int timeInMilliseconds, string playerId = null)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                bool recorded = await gameCache.SubmitAnswerAsync(gameCode, Context.ConnectionId, answer, timeInMilliseconds, playerId);
                if (!recorded)
                {
                    logger.LogWarning(
                        "SubmitAnswer dropped for game {GameCode}: no player found for connection {ConnectionId} (likely a reconnect changed the connection id).",
                        gameCode, Context.ConnectionId);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in SubmitAnswer for game {GameCode}", gameCode);
            }
        }

        public async Task ShowFinalJeffpardyClue(string gameCode)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                await gameCache.ShowFinalJeffpardyClueAsync(gameCode);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in ShowFinalJeffpardyClue for game {GameCode}", gameCode);
            }
        }

        public async Task EndFinalJeffpardy(string gameCode)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                await gameCache.EndFinalJeffpardyAsync(gameCode);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in EndFinalJeffpardy for game {GameCode}", gameCode);
            }
        }

    }
}
