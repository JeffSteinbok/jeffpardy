import * as signalR from "@microsoft/signalr";
import { Logger } from "./utilities/Logger";
import { JeffpardyHostController } from "./JeffpardyHostController";
import { IPlayer } from "./interfaces/IPlayer";

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


        this.hubConnection.on('updateUsers', (users: IPlayer[]) => {
            Logger.debug(JSON.stringify(users));
            this.jeffpardyHostController.updateUsers(users);
        });

        this.hubConnection.on('assignWinner', (user) => {
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
}
