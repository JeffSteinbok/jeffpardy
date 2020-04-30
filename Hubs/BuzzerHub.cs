using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Timers;
using Microsoft.AspNetCore.SignalR;
using Jeffpardy;

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

        public async void ConnectHost(string gameCode)
        {
            if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
            await this.buzzer.ConnectHostAsync(Context.ConnectionId, gameCode);
        }
        public async void ConnectPlayerLobby(string gameCode)
        {
            if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
            await this.buzzer.ConnectPlayerLobbyAsync(Context.ConnectionId, gameCode);
        }

        public async void ConnectPlayer(string gameCode, string team, string name)
        {
            if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
            if (string.IsNullOrEmpty(team)) { throw new ArgumentNullException("team"); }
            if (string.IsNullOrEmpty(name)) { throw new ArgumentNullException("name"); }
            await this.buzzer.ConnectPlayerAsync(Context.ConnectionId, gameCode, team, name);
        }

        public async void ResetBuzzer(string gameCode)
        {
            if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
            await this.buzzer.ResetBuzzerAsync(gameCode);
        }

        public async void ActivateBuzzer(string gameCode)
        {
            if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
            await this.buzzer.ActivateBuzzerAsync(gameCode);
        }

        public void BuzzIn(string gameCode, int timeInMillisenconds)
        {
            if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
            buzzer.BuzzIn(gameCode, Context.ConnectionId, timeInMillisenconds);
        }

        public async void StartFinalJeffpardy(string gameCode)
        {
            if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
            await buzzer.StartFinalJeffpardyAsync(gameCode);
        }

        public async void SubmitWager(string gameCode, int wagerAmount)
        {
            if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
            await buzzer.SubmitWagerAsync(gameCode, Context.ConnectionId, wagerAmount);
        }
        public async void SubmitAnswer(string gameCode, string answer, int timeInMilliseconds)
        {
            if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
            await buzzer.SubmitAnswerAsync(gameCode, Context.ConnectionId, answer, timeInMilliseconds);
        }

        public async void ShowFinalJeffpardyClue(string gameCode)
        {
            if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
            await buzzer.ShowFinalJeffpardyClueAsync(gameCode);
        }

        public async void EndFinalJeffpardy(string gameCode)
        {
            if (string.IsNullOrEmpty(gameCode)) { throw new ArgumentNullException("gameCode"); }
            await buzzer.EndFinalJeffpardyAsync(gameCode);
        }

    }
}
