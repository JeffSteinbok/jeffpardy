import * as React from "react";
import { ScoreboardEntry, ScoreboardEntryBuzzerState } from "./ScoreboardEntry";
import * as signalR from "@microsoft/signalr";
import { Logger } from "../../utilities/Logger";
import { IPlayer } from "../../../interfaces/IPlayer";
import { JeopardyController } from "../../JeopardyController";
import { Key, SpecialKey } from "../../utilities/Key";

const connection = new signalR.HubConnectionBuilder()
    .withUrl("/hub/buzzer")
    .build();

connection.on("messageReceived", (username: string, message: string) => {
    let m = document.createElement("div");

    m.innerHTML =
        `<div class="message-author">${username}</div><div>${message}</div>`;

});


export interface IScoreboardProps {
    jeopardyController: JeopardyController;
}

export interface IScoreboardState {
    message: string;
    users: IPlayer[];
    teams: { [key: string]: IPlayer[] };
    logMessages: string[];
    hubConnection: signalR.HubConnection;
    connected: boolean;
    buzzerActive: boolean;
    buzzerLocked: boolean;
    buzzed: boolean;
    buzzedInUser: IPlayer;
    isClueShown: boolean;
}

export interface IScoreboard {
    showClue: () => void;
    hideClue: () => void;
}
/**
 * Top bar containing toolbar buttons and drop downs
 */
export class Scoreboard extends React.Component<IScoreboardProps, IScoreboardState> implements IScoreboard {

    constructor(props: any) {
        super(props);

        this.props.jeopardyController.setScoreboard(this);

        this.state = {
            message: '',
            users: [],
            teams: {},
            logMessages: [],
            hubConnection: null,
            connected: false,
            buzzerActive: false,
            buzzerLocked: false,
            buzzed: false,
            buzzedInUser: null,
            isClueShown: false
        };
    }

    resetBuzzer = () => {


        this.state.hubConnection
            .invoke('resetBuzzer')
            .catch(err => console.error(err));
    };


    activateBuzzer = () => {


        this.state.hubConnection
            .invoke('activateBuzzer')
            .catch(err => console.error(err));
        this.setState({ message: '' });
    };

    showClue = () => {
        this.setState({ isClueShown: true });
    };

    hideClue = () => {
        this.setState({ isClueShown: false });
    };

    showBoard = () => {
        this.props.jeopardyController.hideClue();
    };

    showQuestion = () => {
        //this.props.jeopardyController.jeopardyBoard.showQuestion();
    };


    handleKeyDOwn = (event: KeyboardEvent) => {
        switch (event.keyCode) {
            case SpecialKey.ESCAPE:
                this.showBoard();
                break;
            case SpecialKey.SPACE:
                this.showQuestion();
                break;
        }
    }

    componentDidMount = () => {

        window.addEventListener("keydown", this.handleKeyDOwn)

        const hubConnection: signalR.HubConnection = new signalR.HubConnectionBuilder()
            .withUrl('/hub/buzzer')
            .build();

        this.setState({ hubConnection }, () => {
            this.state.hubConnection
                .start()
                .then(() => {
                    console.log('Connection started!');
                })
                .catch(err => console.log('Error while establishing connection :('));

            this.state.hubConnection.on('updateUsers', (users: IPlayer[]) => {
                Logger.debug(JSON.stringify(users));
                this.setState({ "users": users });


                if (this.state.users.length > 0) {
                    let r = this.state.users.reduce((acc, obj) => {
                        let k = obj.team;
                        if (!acc[k]) {
                            acc[k] = []
                        }
                        acc[k].push(obj);
                        return acc
                    },
                        {});

                    this.setState({ teams: r });
                }
            });

            this.state.hubConnection.on('assignWinner', (user) => {
                this.setState({ buzzedInUser: user });
                // If I'm the winner, leave the buzzer at buzzed.
                // If not the winner, show it as locked out.
                if (this.state.hubConnection.connectionId == user.connectionId) {

                } else {
                    this.setState({ buzzerLocked: true });
                }
            });

            this.state.hubConnection.on('resetBuzzer', (nick, receivedMessage) => {
                this.setState({
                    buzzed: false,
                    buzzerActive: false,
                    buzzerLocked: false,
                    buzzedInUser: null
                })
            });

            this.state.hubConnection.on('activateBuzzer', (nick, receivedMessage) => {
                this.setState({ buzzerActive: true });
            });
        });
    }

    componentWillUnmount() {
        this.state.hubConnection.stop();
        window.addEventListener("keydown", this.handleKeyDOwn);
    }

    public render() {

        return (
            <div id="scoreboard">
                <div className="scoreboardMargin">
                    <button disabled={ !this.state.isClueShown } onClick={ this.showBoard }>Show Board (esc)</button>
                    <button disabled={ !this.state.buzzerActive } onClick={ this.resetBuzzer }>Reset</button>
                    <button disabled={ this.state.buzzerActive } onClick={ this.activateBuzzer }>Activate</button>
                </div>

                <div className="scoreEntries">
                    { Object.keys(this.state.teams).sort().map((teamName, index) => {
                        let buzzerState = ScoreboardEntryBuzzerState.Off;
                        let buzzedInUserName = "";
                        if (this.state.buzzerActive) { buzzerState = ScoreboardEntryBuzzerState.Active }
                        if (this.state.buzzedInUser != null && this.state.buzzedInUser.team == teamName) {
                            buzzerState = ScoreboardEntryBuzzerState.BuzzedIn;
                            buzzedInUserName = this.state.buzzedInUser.name;
                        }

                        return (
                            <ScoreboardEntry key={ index } teamName={ teamName } buzzerState={ buzzerState } buzzedInUserName={ buzzedInUserName } />
                        )
                    }) }
                </div>

                <div className="scoreboardMargin"></div>
            </div>
        );
    }
}
