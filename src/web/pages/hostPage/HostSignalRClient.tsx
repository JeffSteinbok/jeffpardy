// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as signalR from "@microsoft/signalr";
import { Logger } from "../../utilities/Logger";
import { JeffpardyHostController } from "./JeffpardyHostController";
import { IClue, IPlayer, IBuzzerAttempt, TeamDictionary } from "../../Types";
import { IGameRound } from "./Types";

export interface IHostSignalRClient {
    resetBuzzer: () => void;
    activateBuzzer: () => void;
    showClue: (clue: IClue) => void;
    startRound: (round: IGameRound) => void;
    broadcastScores: (scores: { [key: string]: number }) => void;
    startFinalJeffpardy: (scores: { [key: string]: number }) => void;
    showFinalJeffpardyClue: () => void;
    endFinalJeffpardy: () => void;
}

/** SignalR client that manages the real-time connection between the host and the game hub. */
export class HostSignalRClient implements IHostSignalRClient {
    hubConnection: signalR.HubConnection;
    jeffpardyHostController: JeffpardyHostController;
    gameCode: string;
    hostCode: string;
    private unloadHandler: () => void;

    constructor(jeffpardyHostController: JeffpardyHostController, gameCode: string, hostCode: string) {
        this.jeffpardyHostController = jeffpardyHostController;
        this.gameCode = gameCode;
        this.hostCode = hostCode;

        this.unloadHandler = () => {
            this.hubConnection.stop();
        };

        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl("/hub/game")
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Trace)
            .build();

        this.hubConnection
            .start()
            .then(() => {
                console.log("Connection started!");
                window.addEventListener("unload", this.unloadHandler);

                this.hubConnection.invoke("connectHost", this.gameCode, this.hostCode);
            })
            .catch((_err) => console.log("Error while establishing connection :("));

        this.hubConnection.on("updateUsers", (teams: TeamDictionary) => {
            Logger.debug("HostSignalRClient:on updateUsers", teams);
            this.jeffpardyHostController.updateUsers(teams);
        });

        this.hubConnection.on("submitWager", (user: IPlayer, wager: number) => {
            this.jeffpardyHostController.submitWager(user, wager);
        });

        this.hubConnection.on("submitAnswer", (user: IPlayer, answer: string, responseTime: number) => {
            this.jeffpardyHostController.submitAnswer(user, answer, responseTime);
        });

        this.hubConnection.on("assignWinner", (user: IPlayer, _winningTime: number, topBuzzers: IBuzzerAttempt[]) => {
            this.jeffpardyHostController.assignBuzzedInUser(user, topBuzzers || []);
        });
    }

    public resetBuzzer = () => {
        this.hubConnection.invoke("resetBuzzer", this.gameCode).catch((err) => console.error(err));
    };

    public activateBuzzer = () => {
        Logger.debug("HostSignalRClient:activateBuzzer");

        this.hubConnection.invoke("activateBuzzer", this.gameCode).catch((err) => console.error(err));
    };

    public startRound = (round: IGameRound) => {
        Logger.debug("HostSignalRClient:showClue");

        this.hubConnection.invoke("startRound", this.gameCode, round).catch((err) => console.error(err));
    };

    public showClue = (clue: IClue) => {
        Logger.debug("HostSignalRClient:showClue");

        this.hubConnection.invoke("showClue", this.gameCode, clue).catch((err) => console.error(err));
    };

    public broadcastScores = (scores: { [key: string]: number }) => {
        Logger.debug("HostSignalRClient:broadcastScores", scores);

        this.hubConnection.invoke("broadcastScores", this.gameCode, scores).catch((err) => console.error(err));
    };

    public startFinalJeffpardy = (scores: { [key: string]: number }) => {
        Logger.debug("HostSignalRClient:startFinalJeffpardy");

        this.hubConnection.invoke("startFinalJeffpardy", this.gameCode, scores).catch((err) => console.error(err));
    };

    public showFinalJeffpardyClue = () => {
        Logger.debug("HostSignalRClient:showFinalJeffpardyClue");

        this.hubConnection.invoke("showFinalJeffpardyClue", this.gameCode).catch((err) => console.error(err));
    };

    public endFinalJeffpardy = () => {
        Logger.debug("HostSignalRClient:endFinalJeffpardy");

        this.hubConnection.invoke("endFinalJeffpardy", this.gameCode).catch((err) => console.error(err));
    };

    public dispose = () => {
        window.removeEventListener("unload", this.unloadHandler);
    };
}
