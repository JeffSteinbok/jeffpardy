import { IJeffpardyBoard } from "./gameBoard/JeffpardyBoard";
import { Logger } from "../../utilities/Logger";
import { IScoreboard } from "./scoreboard/Scoreboard";
import { WebServerApiManager, IApiExecutionContext } from "../../utilities/WebServerApiManager";
import { IHostPage, HostPageViewMode } from "./HostPage";
import { IHostSignalRClient, HostSignalRClient } from "./HostSignalRClient";
import { IPlayer, TeamDictionary, ITeam } from "../../Types";
import { Debug, DebugFlags } from "../../utilities/Debug";
import { IGameData, ICategory, IGameRound, IClue } from "./Types";

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

    hostSignalRClient: IHostSignalRClient;

    constructor(gameCode: string) {
        this.hostSignalRClient = new HostSignalRClient(this, gameCode)
    }

    public loadGameData() {
        Logger.debug("JeffpardyHostController:loadGameData");

        if (!Debug.IsFlagSet(DebugFlags.LocalCategories)) {
            let context: IApiExecutionContext = {
                showProgressIndicator: true,
                apiName: "/api/Categories/GetGameData",
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
            this.onGameDataLoaded(Debug.GameData);
        }
    }

    public onGameDataLoaded = (gameData: IGameData) => {
        Logger.debug("JeffpardyHostController:onGameDataLoaded");

        // Assign the scores
        gameData.rounds.forEach((gameRound: IGameRound) => {
            gameRound.categories.forEach((category: ICategory) => {
                for (var i: number = 0; i < category.clues.length; i++) {
                    category.clues[i].value = (i + 1) * 100 * (gameRound.id + 1);
                }
            });
        });

        // Assign the daily doubles - 2 ^ roundIndex
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
                    for (var i: number = 1; i < category.clues.length; i++) {
                        category.clues[i].isAsked = true;
                    }
                });
            });
        }


        this.gameData = gameData;

        this.hostPage.onGameDataLoaded(this.gameData);
    }

    public setCustomGameData(gameData: IGameData) {
        this.gameData = gameData;
        this.hostPage.onGameDataLoaded(gameData);
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

    public resetBuzzer() {
        this.hostSignalRClient.resetBuzzer();
    }

    public activateBuzzer() {
        this.jeffpardyBoard.startTimer();
        this.hostSignalRClient.activateBuzzer();
    }

    public assignBuzzedInUser(user: IPlayer) {
        this.jeffpardyBoard.stopTimer();
        this.scoreboard.onAssignBuzzedInUser(user);
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
        this.scoreboard.onClueShown(clue);
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
    }

    public buzzerTimeout = () => {
        this.scoreboard.onBuzzerTimeout();
    }
}
