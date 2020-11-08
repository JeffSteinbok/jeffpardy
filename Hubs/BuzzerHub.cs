using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Timers;
using Microsoft.AspNetCore.SignalR;
using Jeffpardy;
using System.Diagnostics;

namespace Jeffpardy.Hubs
{
    public class BuzzerHub : Hub
    {
        Buzzer buzzer;

        public BuzzerHub(Buzzer buzzer)
        {
            this.buzzer = buzzer;
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            await this.buzzer.RemoveUserAsync(Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }

        public async void ConnectHost(string gameCode, string hostCode)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                if (string.IsNullOrEmpty(hostCode)) { throw new ArgumentNullException("hostCode"); }
                await this.buzzer.ConnectHostAsync(Context.ConnectionId, gameCode, hostCode);
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
                await this.buzzer.ConnectPlayerLobbyAsync(Context.ConnectionId, gameCode);
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
                await this.buzzer.ConnectPlayerAsync(Context.ConnectionId, gameCode, team, name);
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
                await this.buzzer.ResetBuzzerAsync(gameCode);
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
                await this.buzzer.ActivateBuzzerAsync(gameCode);
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex);
            }
        }

        public void BuzzIn(string gameCode, int timeInMillisenconds)
        {
            try
            {
                if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
                buzzer.BuzzIn(gameCode, Context.ConnectionId, timeInMillisenconds);
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
                await buzzer.ShowClueAsync(gameCode, clue);
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
                await buzzer.StartFinalJeffpardyAsync(gameCode, scores);
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
                await buzzer.SubmitWagerAsync(gameCode, Context.ConnectionId, wagerAmount);

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
                await buzzer.SubmitAnswerAsync(gameCode, Context.ConnectionId, answer, timeInMilliseconds);
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
                await buzzer.ShowFinalJeffpardyClueAsync(gameCode);
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
                await buzzer.EndFinalJeffpardyAsync(gameCode);
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex);
            }
        }

    }
}
