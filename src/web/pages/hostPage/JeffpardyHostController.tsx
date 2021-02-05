import { IJeffpardyBoard } from "./gameBoard/JeffpardyBoard";
import { Logger } from "../../utilities/Logger";
import { IScoreboard } from "./scoreboard/Scoreboard";
import { WebServerApiManager, IApiExecutionContext } from "../../utilities/WebServerApiManager";
import { IHostPage, HostPageViewMode } from "./HostPage";
import { IHostSignalRClient, HostSignalRClient } from "./HostSignalRClient";
import { IPlayer, TeamDictionary, ITeam } from "../../Types";
import { Debug, DebugFlags } from "../../utilities/Debug";
import { RoundDescriptor, IGameData, IGameRound, FinalJeffpardyWagerDictionary, FinalJeffpardyAnswerDictionary } from "./Types";
import { ICategory, IClue } from "../../Types";
import { ApplicationInsights, IEventTelemetry } from '@microsoft/applicationinsights-web'
import createTypography from "@material-ui/core/styles/createTypography";

const appInsights = new ApplicationInsights({
    config: {
        instrumentationKey: 'bd4b6a26-6089-4825-b9d4-0f7db9f5631a'
        /* ...Other Configuration Options... */
    }
});

appInsights.loadAppInsights();
appInsights.trackPageView(); // Manually call trackPageView to establish the current user/session/pageview


/**
 * This class is to be passed down to pages and components so they can interact with
 * global state in a type-safe manner.
 */
export class JeffpardyHostController {

    hostPage: IHostPage;
    jeffpardyBoard: IJeffpardyBoard;
    scoreboard: IScoreboard;

    teams: TeamDictionary = {};
    teamCount: number;
    gameData: IGameData;
    categories: ICategory[];
    buzzerActive: boolean = false;

    hostSignalRClient: IHostSignalRClient;

    finalJeffpardyWagers: FinalJeffpardyWagerDictionary = {};
    finalJeffpardyAnswers: FinalJeffpardyAnswerDictionary = {};

    constructor(gameCode: string, hostCode: string) {
        this.hostSignalRClient = new HostSignalRClient(this, gameCode, hostCode)
    }

    public loadGameData() {
        Logger.debug("JeffpardyHostController:loadGameData");

        if (!Debug.IsFlagSet(DebugFlags.LocalCategories)) {
            let context: IApiExecutionContext = {
                showProgressIndicator: true,
                apiName: "/api/Categories/GameData",
                formData: {},
                json: true,
                success: (results: IGameData) => {
                    this.onGameDataLoaded(results);
                },
                error: null
            };

            let wsam: WebServerApiManager = new WebServerApiManager();
            wsam.executeApi(context);
        }
        else {
            this.onGameDataLoaded(Debug.generateGameData());
        }
    }

    public updateSingleCategory(category: ICategory) {

        appInsights.trackEvent({ name: "UpdateSingleCategory" }, { "OldCategory": category.title });

        // Find the category in GameData
        let existingRound: IGameRound = null;
        let categoryIndex: number = -1;

        this.gameData.rounds.forEach((gameRound: IGameRound, index: number) => {
            if (categoryIndex == -1) {
                categoryIndex = gameRound.categories.indexOf(category);
                if (categoryIndex >= 0) {
                    existingRound = gameRound;
                }
            }
        });

        let roundDescriptor: RoundDescriptor = RoundDescriptor.Jeffpardy;
        if (existingRound == null) {
            roundDescriptor = RoundDescriptor.FinalJeffpardy;
        } else if (existingRound.id == 1) {
            roundDescriptor = RoundDescriptor.SuperJeffpardy;
        }

        if (!Debug.IsFlagSet(DebugFlags.LocalCategories)) {
            let context: IApiExecutionContext = {
                showProgressIndicator: true,
                apiName: "/api/Categories/RandomCategory/" + roundDescriptor,
                formData: {},
                json: true,
                success: (results: ICategory) => {
                    if (existingRound != null) {
                        existingRound.categories[categoryIndex] = results;
                    }
                    else {
                        this.gameData.finalJeffpardyCategory = results;
                    }
                    this.onGameDataLoaded(this.gameData);
                },
                error: null
            };

            let wsam: WebServerApiManager = new WebServerApiManager();
            wsam.executeApi(context);
        }
        else {
            if (existingRound != null) {
                existingRound.categories[categoryIndex] = Debug.generateCategory();
            }
            else {
                this.gameData.finalJeffpardyCategory = Debug.generateFinalCategory();
            }
            this.onGameDataLoaded(this.gameData);
        }
    }


    public updateRound(round: IGameRound) {
        appInsights.trackEvent({ name: "UpdateRound" });

        let updateRoundId = round.id;

        if (!Debug.IsFlagSet(DebugFlags.LocalCategories)) {
            let context: IApiExecutionContext = {
                showProgressIndicator: true,
                apiName: "/api/Categories/GameData",
                formData: {},
                json: true,
                success: (results: IGameData) => {
                    this.gameData.rounds[updateRoundId] = results.rounds[updateRoundId];
                    this.onGameDataLoaded(this.gameData);
                },
                error: null
            };

            let wsam: WebServerApiManager = new WebServerApiManager();
            wsam.executeApi(context);
        }
        else {
            this.gameData.rounds[updateRoundId] = Debug.generateGameData().rounds[updateRoundId];
            this.onGameDataLoaded(this.gameData);
        }
    }

    public onGameDataLoaded = (gameData: IGameData) => {
        Logger.debug("JeffpardyHostController:onGameDataLoaded");

        // Assign the scores
        // Reset the daily doubles
        gameData.rounds.forEach((gameRound: IGameRound) => {
            gameRound.name = gameRound.id == 0 ? "Jeffpardy" : "Super Jeffpardy";
            gameRound.categories.forEach((category: ICategory) => {
                category.hasDailyDouble = false;
                for (var i: number = 0; i < category.clues.length; i++) {
                    category.clues[i].isDailyDouble = false;
                    category.clues[i].value = (i + 1) * 100 * (gameRound.id + 1);
                }
            });
        });

        // assign the daily doubles - 2 ^ roundIndex
        // We're going to make sure there is only one per category
        // We're going to weight them towards the bottom 3 rows.
        // There are actually 30 spots on the board.  We're going
        // to triple the weight of the bottom 3 rows.
        if (!Debug.IsFlagSet(DebugFlags.DailyDouble00)) {
            for (var i: number = 0; i < gameData.rounds.length; i++) {
                let round: IGameRound = gameData.rounds[i];
                let numDDs = Math.pow(2, i);

                for (var dd: number = 0; dd < numDDs; dd++) {
                    let ddCat: number;

                    // Pick a category randomly
                    do {
                        ddCat = Math.floor(Math.random() * 6);
                    } while (round.categories[ddCat].hasDailyDouble);
                    round.categories[ddCat].hasDailyDouble = true;

                    // Pick a clue randomly, but weight towards the bottom.
                    // So, pick from 11.
                    // If the number is >= 8, reduce by 6
                    // If the number is >= 5, reduce by 3
                    let ddClue: number;
                    do {
                        ddClue = Math.floor(Math.random() * 11);
                        if (ddClue >= 8) { ddClue -= 6 }
                        if (ddClue >= 5) { ddClue -= 3 }
                    } while (round.categories[ddCat].clues[ddClue].isDailyDouble);
                    round.categories[ddCat].clues[ddClue].isDailyDouble = true;
                }
            }
        } else {
            gameData.rounds[0].categories[0].hasDailyDouble = true;
            gameData.rounds[0].categories[0].clues[0].isDailyDouble = true;
        }

        if (Debug.IsFlagSet(DebugFlags.ShortRound)) {
            gameData.rounds.forEach((gameRound: IGameRound) => {
                gameRound.categories.forEach((category: ICategory) => {
                    for (var i: number = 0; i < category.clues.length; i++) {
                        category.clues[i].isAsked = true;
                    }
                    category.isAsked = true;
                });
                gameRound.categories[0].isAsked = false;
                gameRound.categories[0].clues[0].isAsked = false;
            });
        }


        this.gameData = gameData;

        this.hostPage.onGameDataLoaded(this.gameData);
    }

    public setCustomGameData(gameData: IGameData) {
        this.onGameDataLoaded(gameData);
    }

    public updateUsers(teams: TeamDictionary) {
        Logger.debug("JeffpardyHostController:updateUsers", teams);
        let teamCount: number = 0;

        for (var key in teams) {
            if (teams.hasOwnProperty(key)) {

                // Copy the score over to the new teams object
                if (this.teams.hasOwnProperty(key)) {
                    teams[key].score = this.teams[key].score;
                }
                else {
                    teams[key].score = 0;
                }
                teamCount++;
            }
        }

        this.teams = teams;
        this.teamCount = teamCount;
        this.hostPage.onUpdateTeams(this.teams);
    }

    public submitWager(user: IPlayer, wager: number) {
        // TODO:  Something to stop a wager from being entered twice, or after the clue is shown
        // Or, take this all out of the controller
        Logger.debug("JeffpardyHostController:submitWager", user, wager);
        this.finalJeffpardyWagers[user.connectionId] = wager;
        this.hostPage.onUpdateFinalJeffpardy(this.finalJeffpardyWagers, this.finalJeffpardyAnswers);
    }

    public submitAnswer(user: IPlayer, answer: string, responseTime: number) {
        // TODO:  Something to stop an answer from being entered twice, or after the tally has started.
        // Or, take this all out of the controller
        Logger.debug("JeffpardyHostController:submitAnswer", user, answer);
        this.finalJeffpardyAnswers[user.connectionId] = { answer: answer, responseTime: responseTime }
        this.hostPage.onUpdateFinalJeffpardy(this.finalJeffpardyWagers, this.finalJeffpardyAnswers);
    }


    public resetBuzzer() {
        this.buzzerActive = false;
        this.hostSignalRClient.resetBuzzer();
    }

    public activateBuzzer() {
        this.buzzerActive = true;
        this.jeffpardyBoard.startTimer();
        this.hostSignalRClient.activateBuzzer();
    }

    public assignBuzzedInUser(user: IPlayer) {
        // If the timer has expired, we have to not honor this...
        if (this.buzzerActive) {
            this.jeffpardyBoard.stopTimer();
            this.scoreboard.onAssignBuzzedInUser(user);
        }
    }

    public setViewMode(viewMode: HostPageViewMode) {
        this.hostPage.setViewMode(viewMode);
    }

    public setJeffpardyBoard(board: IJeffpardyBoard) {
        this.jeffpardyBoard = board;
    }

    public setScoreboard(scoreboard: IScoreboard) {
        this.scoreboard = scoreboard;
    }

    public controllingTeamChange(team: ITeam) {
        this.hostPage.onControllingTeamChange(team);
    }

    public showClue(clue: IClue) {
        this.hostSignalRClient.showClue(clue);
        this.scoreboard.onClueShown(clue);
    }

    // This is ugly; the controller should have the GameData and send it to the
    // host page rather than the host sending it back up here.
    public startRound(round: IGameRound) {
        this.hostSignalRClient.startRound(round);
    }

    public endRound() {
        this.jeffpardyBoard.endRound();
    }

    public setDailyDoubleWager(wager: number) {
        this.scoreboard.onSetDailyDoubleWager(wager);
    }

    public showQuestion() {
        this.jeffpardyBoard.showQuestion();
    }

    public showBoard = () => {
        this.jeffpardyBoard.showBoard();
    }

    public startNewRound = () => {
        this.hostPage.startNewRound();
        this.scoreboard.onStartNormalRound();
    }

    public startIntermission = () => {
        this.scoreboard.onStartIntermission();
    }

    public buzzerTimeout = () => {
        this.buzzerActive = false;
        this.scoreboard.onBuzzerTimeout();
    }

    public startFinalJeffpardy = () => {
        // This line should move most likely.
        this.controllingTeamChange(null);
        this.scoreboard.onStartFinalJeffpardy();
        this.hostPage.startFinalJeffpardy();

        let scores: { [key: string]: number } = {};

        // Get all the scores
        Object.keys(this.teams).map((teamName, index) => {
            scores[teamName] = this.teams[teamName].score;
        });

        this.hostSignalRClient.startFinalJeffpardy(scores);
    }

    public showFinalJeffpardyClue = (clue: IClue) => {
        this.hostSignalRClient.showClue(clue);
        this.hostSignalRClient.showFinalJeffpardyClue();
    }

    public endFinalJeffpardy = () => {
        appInsights.trackEvent({ name: "EndGame" });
        this.hostSignalRClient.endFinalJeffpardy();
    }
}
