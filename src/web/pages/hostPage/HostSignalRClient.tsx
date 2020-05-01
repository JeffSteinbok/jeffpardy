import * as signalR from "@microsoft/signalr";
import { Logger } from "../../utilities/Logger";
import { JeffpardyHostController } from "./JeffpardyHostController";
import { IPlayer, TeamDictionary } from "../../Types";

enum GameBoardState {
    Normal,
    ClueGiven,
    ClueGivenBuzzerActive,
    ClueAnswered,
    Question
}

export interface IHostSignalRClient {
    resetBuzzer: () => void;
    activateBuzzer: () => void;
    startFinalJeffpardy: (scores: { [key: string]: number }) => void;
    showFinalJeffpardyClue: () => void;
    endFinalJeffpardy: () => void;
}

export class HostSignalRClient implements IHostSignalRClient {

    hubConnection: signalR.HubConnection;
    jeffpardyHostController: JeffpardyHostController;
    gameCode: string;

    constructor(jeffpardyHostController: JeffpardyHostController, gameCode: string) {
        this.jeffpardyHostController = jeffpardyHostController;
        this.gameCode = gameCode;

        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl('/hub/buzzer')
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Trace)
            .build();

        this.hubConnection
            .start()
            .then(() => {
                console.log('Connection started!');
                window.addEventListener("unload", () => { this.hubConnection.stop() });

                this.hubConnection
                    .invoke('connectHost', this.gameCode);
            })
            .catch(err => console.log('Error while establishing connection :('));


        this.hubConnection.on('updateUsers', (teams: TeamDictionary) => {
            Logger.debug("HostSignalRClient:on updateUsers", teams);
            this.jeffpardyHostController.updateUsers(teams);
        });

        this.hubConnection.on('submitWager', (user: IPlayer, wager: number) => {
            this.jeffpardyHostController.submitWager(user, wager);
        })

        this.hubConnection.on('submitAnswer', (user: IPlayer, answer: string, responseTime: number) => {
            this.jeffpardyHostController.submitAnswer(user, answer, responseTime);
        })

        this.hubConnection.on('assignWinner', (user: IPlayer) => {
            this.jeffpardyHostController.assignBuzzedInUser(user);
        });
    }


    public resetBuzzer = () => {
        this.hubConnection
            .invoke('resetBuzzer', this.gameCode)
            .catch(err => console.error(err));
    }

    public activateBuzzer = () => {
        Logger.debug("HostSignalRClient:activateBuzzer")

        this.hubConnection
            .invoke('activateBuzzer', this.gameCode)
            .catch(err => console.error(err));
    };

    public startFinalJeffpardy = (scores: { [key: string]: number }) => {
        Logger.debug("HostSignalRClient:startFinalJeffpardy")

        this.hubConnection
            .invoke('startFinalJeffpardy', this.gameCode, scores)
            .catch(err => console.error(err));
    }

    public showFinalJeffpardyClue = () => {
        Logger.debug("HostSignalRClient:showFinalJeffpardyClue")

        this.hubConnection
            .invoke('showFinalJeffpardyClue', this.gameCode)
            .catch(err => console.error(err));
    }

    public endFinalJeffpardy = () => {
        Logger.debug("HostSignalRClient:endFinalJeffpardy")

        this.hubConnection
            .invoke('endFinalJeffpardy', this.gameCode)
            .catch(err => console.error(err));
    }
}
