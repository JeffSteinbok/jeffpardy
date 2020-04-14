import { IJeffpardyBoard } from "./components/gameBoard/JeffpardyBoard";
import { Logger } from "./utilities/Logger";
import { IScoreboard } from "./components/scoreboard/Scoreboard";
import { WebServerApiManager, IApiExecutionContext } from "./utilities/WebServerApiManager";
import { IHostPage, HostPageViewMode } from "./HostPage";
import { IHostSignalRClient, HostSignalRClient } from "./HostSignalRClient";
import { IPlayer } from "./interfaces/IPlayer";

export interface ITeam {
    name: string;
    score: number;
    players: IPlayer[];
}

export interface IClue {
    clue: string;
    question: string;
    value: number;
    isAsked: boolean;
}

export interface ICategory {
    title: string;
    comment: string;
    // Need to change the JSON format to fix this
    clues: IClue[];
    isAsked: boolean;
}

export interface IGameRound {
    id: number;
    categories: ICategory[];
}

export interface IGameData {
    rounds: IGameRound[];
}

/**
 * This class is to be passed down to pages and components so they can interact with
 * global state in a type-safe manner.
 */
export class JeffpardyHostController {

    hostPage: IHostPage;
    jeffpardyBoard: IJeffpardyBoard;
    scoreboard: IScoreboard;

    teams: { [key: string]: ITeam };
    teamCount: number;
    gameData: IGameData;
    categories: ICategory[];

    hostSignalRClient: IHostSignalRClient;

    constructor(gameCode: string) {
        this.hostSignalRClient = new HostSignalRClient(this, gameCode)
    }

    public loadGameData() {
        Logger.debug("JeffpardyHostController:loadGameData");
        let context: IApiExecutionContext = {
            showProgressIndicator: true,
            apiName: "/api/Categories/GetGameData",
            formData: {},
            json: true,
            success: (results: IGameData) => {

                results.rounds.forEach((gameRound: IGameRound) => {
                    gameRound.categories.forEach((category: ICategory) => {
                        for (var i: number = 0; i < category.clues.length; i++) {
                            category.clues[i].value = (i + 1) * 100 * (gameRound.id + 1);
                        }
                    });
                })

                this.gameData = results;

                this.hostPage.onGameDataLoaded(this.gameData);
            },
            error: null
        };

        let wsam: WebServerApiManager = new WebServerApiManager();
        wsam.executeApi(context);
    }

    public updateUsers(users: IPlayer[]) {

        let teams: { [key: string]: ITeam } = {};

        if (users.length > 0) {
            teams = users.reduce((acc, obj) => {
                let k = obj.team;
                if (!acc[k]) {
                    acc[k] = []
                }
                acc[k].push(obj);
                return acc
            },
                {});
        }

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

    public showClue(clue: IClue) {
        this.scoreboard.onClueShown(clue.value);
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
