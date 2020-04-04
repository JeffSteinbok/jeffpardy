import * as React from "react";
import { ScoreboardEntry, ScoreboardEntryBuzzerState } from "./ScoreboardEntry";
import * as signalR from "@microsoft/signalr";
import { Logger } from "../../utilities/Logger";
import { IBuzzerUser } from "../../Buzzer";

const connection = new signalR.HubConnectionBuilder()
    .withUrl("/hub/buzzer")
    .build();

connection.on("messageReceived", (username: string, message: string) => {
    let m = document.createElement("div");

    m.innerHTML =
        `<div class="message-author">${username}</div><div>${message}</div>`;

});


export interface IScoreboardProps {
}

export interface IScoreboardState {
    message: string;
    users: IBuzzerUser[];
    teams: { [key: string]: IBuzzerUser[] };
    logMessages: string[];
    hubConnection: signalR.HubConnection;
    name: string;
    team: string;
    connected: boolean;
    buzzerActive: boolean;
    buzzerLocked: boolean;
    buzzed: boolean;
    buzzedInUser: IBuzzerUser;
}

/**
 * Top bar containing toolbar buttons and drop downs
 */
export class Scoreboard extends React.Component<IScoreboardProps, IScoreboardState> {

    constructor(props: any) {
        super(props);

        this.state = {
            message: '',
            users: [],
            teams: {},
            logMessages: [],
            hubConnection: null,
            name: '',
            team: '',
            connected: false,
            buzzerActive: false,
            buzzerLocked: false,
            buzzed: false,
            buzzedInUser: null
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


    componentDidMount = () => {


        const hubConnection: signalR.HubConnection = new signalR.HubConnectionBuilder()
            .withUrl('/hub/buzzer')
            .build();

        this.setState({ hubConnection }, () => {
            this.state.hubConnection
                .start()
                .then(() => {
                    console.log('Connection started!');

                    this.state.hubConnection
                        .invoke('connect', "WATSON", "PLACEHOLDER")
                        .catch(err => console.error(err));

                })
                .catch(err => console.log('Error while establishing connection :('));

            this.state.hubConnection.on('updateUsers', (users: IBuzzerUser[]) => {
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
    }

    public render() {

        return (
            <div id="scoreboard">
                <div className="scoreboardMargin">
                    { this.state.buzzerActive == true &&
                        <button onClick={ this.resetBuzzer }>Reset</button>
                    }

                    { this.state.buzzerActive == false &&
                        <button onClick={ this.activateBuzzer }>Activate</button>
                    }

                    <button></button>
                    <button>Correct Response</button>
                    <button>Incorrect Response</button>
                </div>

                <div className="scoreEntries">
                    { Object.keys(this.state.teams).sort().map((teamName, index) => {
                        let buzzerState = ScoreboardEntryBuzzerState.Off;
                        if (this.state.buzzerActive) { buzzerState = ScoreboardEntryBuzzerState.Active }
                        if (this.state.buzzedInUser != null && this.state.buzzedInUser.team == teamName) { buzzerState = ScoreboardEntryBuzzerState.BuzzedIn }

                        return (
                            <ScoreboardEntry key={ index } teamName={ teamName } buzzerState={ buzzerState } />
                        )
                    }) }
                </div>

                <div className="scoreboardMargin"></div>
            </div>
        );
    }
}
