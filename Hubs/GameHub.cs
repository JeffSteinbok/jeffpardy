using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading.Tasks;

namespace Jeffpardy.Hubs
{
    public class GameHub : Hub
    {
        GameCache gameCache;

        public GameHub(GameCache gameCache)
        {
            this.gameCache = gameCache;
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            await this.gameCache.RemoveUserAsync(Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }

        public async void ConnectHost(string gameCode, string hostCode)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                if (string.IsNullOrEmpty(hostCode)) { throw new ArgumentNullException("hostCode"); }
                await this.gameCache.ConnectHostAsync(Context.ConnectionId, gameCode, hostCode);
            } catch (Exception ex)
            {
                Debug.WriteLine(ex);
            }
        }
        public async void ConnectPlayerLobby(string gameCode)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                await this.gameCache.ConnectPlayerLobbyAsync(Context.ConnectionId, gameCode);
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex);
            }
        }

        public async void ConnectPlayer(string gameCode, string team, string name)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                if (string.IsNullOrEmpty(team)) { throw new ArgumentNullException("team"); }
                if (string.IsNullOrEmpty(name)) { throw new ArgumentNullException("name"); }
                await this.gameCache.ConnectPlayerAsync(Context.ConnectionId, gameCode, team, name);
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex);
            }
        }

        public async void ResetBuzzer(string gameCode)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                await this.gameCache.ResetBuzzerAsync(gameCode);
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex);
            }
        }

        public async void ActivateBuzzer(string gameCode)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                await this.gameCache.ActivateBuzzerAsync(gameCode);
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex);
            }
        }

        public void BuzzIn(string gameCode, int timeInMillisenconds, int handicapInMilliseconds)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                gameCache.BuzzIn(gameCode, Context.ConnectionId, timeInMillisenconds, handicapInMilliseconds);
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex);
            }
        }

        public async void ShowClue(string gameCode, CategoryClue clue)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                await gameCache.ShowClueAsync(gameCode, clue);
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex);
            }
        }

        public async void StartFinalJeffpardy(string gameCode, Dictionary<string, int> scores)
        {
            try {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                await gameCache.StartFinalJeffpardyAsync(gameCode, scores);
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex);
            }
        }

        public async void SubmitWager(string gameCode, int wagerAmount)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                await gameCache.SubmitWagerAsync(gameCode, Context.ConnectionId, wagerAmount);

            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex);
            }
        }

        public async void SubmitAnswer(string gameCode, string answer, int timeInMilliseconds)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                await gameCache.SubmitAnswerAsync(gameCode, Context.ConnectionId, answer, timeInMilliseconds);
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex);
            }
        }

        public async void ShowFinalJeffpardyClue(string gameCode)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                await gameCache.ShowFinalJeffpardyClueAsync(gameCode);
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex);
            }
        }

        public async void EndFinalJeffpardy(string gameCode)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                await gameCache.EndFinalJeffpardyAsync(gameCode);
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex);
            }
        }

    }
}
