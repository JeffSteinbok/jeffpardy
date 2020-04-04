import * as React from "react";
import * as ReactDOM from "react-dom";
import * as signalR from "@microsoft/signalr";
import { Logger } from "./utilities/Logger";

const connection = new signalR.HubConnectionBuilder()
    .withUrl("/hub/buzzer")
    .build();

connection.on("messageReceived", (username: string, message: string) => {
    let m = document.createElement("div");

    m.innerHTML =
        `<div class="message-author">${username}</div><div>${message}</div>`;

});

connection.start().catch(err => document.write(err));

export interface IBuzzerState {
    message: string;
    users: string[];
    logMessages: string[];
    hubConnection: signalR.HubConnection;
    name: string;
    team: string;
    connected: boolean;
    buzzerActive: boolean;
    buzzerLocked: boolean;
    buzzed: boolean;
}

/**
 * Root page for the application, begins the rendering.
 */
export class Buzzer extends React.Component<any, IBuzzerState> {

    buzzerActivateTime: Date;

    constructor(props: any) {
        super(props);

        this.state = {
            message: '',
            users: [],
            logMessages: [],
            hubConnection: null,
            name: '',
            team: '',
            connected: false,
            buzzerActive: false,
            buzzerLocked: false,
            buzzed: false
        };
    }

    componentDidMount = () => {


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

            this.state.hubConnection.on('updateUsers', (users) => {
                Logger.debug(JSON.stringify(users));
                this.setState({ "users": users });
            });

            this.state.hubConnection.on('assignWinner', (nick, receivedMessage) => {
                this.appendLogMessage(JSON.stringify(nick));

                // If I'm the winner, leave the buzzer at buzzed.
                // If not the winner, show it as locked out.
                if (this.state.name == nick.name) {

                } else {
                    this.setState({ buzzerLocked: true });
                }
            });

            this.state.hubConnection.on('resetBuzzer', (nick, receivedMessage) => {
                this.setState({
                    buzzed: false,
                    buzzerActive: false,
                    buzzerLocked: false
                })
            });

            this.state.hubConnection.on('activateBuzzer', (nick, receivedMessage) => {
                this.buzzerActivateTime = new Date();
                this.appendLogMessage("Buzzer activated at " + this.buzzerActivateTime.getTime())
                this.setState({ buzzerActive: true });
            });
        });
    }

    activateLasers = () => {
        alert(1);
    }

    registerPlayer = () => {
        this.state.hubConnection
            .invoke('connect', (this.state.name))
            .then(() => this.setState({ connected: true }))
            .catch(err => console.error(err));
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


    buzzIn = () => {

        if (this.state.buzzed) {
            Logger.debug("Buzzer clicked when already buzzed. Time:", new Date().getTime());
        } else if (this.state.buzzerLocked) {
            Logger.debug("Buzzer clicked when locked. Time:", new Date().getTime());
        } else if (this.state.buzzerActive) {
            Logger.debug("Buzzer clicked when active. Time:", new Date().getTime());
            this.state.hubConnection
                .invoke('buzzIn', this.state.team, this.state.name, new Date().getTime() - this.buzzerActivateTime.getTime())
                .catch(err => console.error(err));
            this.setState({ buzzed: true });
        } else {
            Logger.debug("Buzzer clicked when not active - applying lockout. Time:", new Date().getTime());

            // If buzzer isn't active yet, apply a 500ms lockout
            if (!this.state.buzzerActive) {
                this.setState({ buzzerLocked: true });

                setTimeout(() => {
                    Logger.debug("Lockout over. Time:", new Date().getTime());
                    this.setState({ buzzerLocked: false });
                }, 500);
            }
        }
    }

    componentWillUnmount() {
        this.state.hubConnection.stop();
    }

    appendLogMessage(text: string) {
        const logMessages = this.state.logMessages.concat([text]);
        this.setState({ logMessages });
        Logger.debug(text)
    }

    public render() {
        let buzzerClassName: string = "inactive";
        if (this.state.buzzerLocked) {
            buzzerClassName = "lockedout";
        } else if (this.state.buzzerActive) {
            if (this.state.buzzed) {
                buzzerClassName = "buzzed";
            } else {
                buzzerClassName = "active";
            }
        } else {
            buzzerClassName = "inactive";
        }

        return (



            <div>
                <br />

                { this.state.connected == false &&
                    <div>
                        Team:
                        <input
                            type="text"
                            value={ this.state.team }
                            onChange={ e => this.setState({ team: e.target.value }) }
                        />
                        <br />
                        Player Name:
                        <input
                            type="name"
                            value={ this.state.name }
                            onChange={ e => this.setState({ name: e.target.value }) }
                        />
                        <button onClick={ this.registerPlayer }>Register Player</button>
                    </div>
                }
                { this.state.connected == true &&
                    <div>
                        Players:
                        <br />
                        <div>
                            { this.state.users.map((message, index) => (
                                <span style={ { display: 'block' } } key={ index }> { JSON.stringify(message) } </span>
                            )) }
                        </div>

                        { this.state.buzzerActive == true &&
                            <button onClick={ this.resetBuzzer }>Reset</button>
                        }

                        { this.state.buzzerActive == false &&
                            <button onClick={ this.activateBuzzer }>Activate</button>
                        }

                        <br />
                        <button id="buzzer" className={ buzzerClassName } onClick={ this.buzzIn }>Buzz</button>

                        <div>
                            { this.state.logMessages.map((message, index) => (
                                <span style={ { display: 'block' } } key={ index }> { JSON.stringify(message) } </span>
                            )) }
                        </div>

                    </div>
                }
            </div>

        );
    }
}


// Start the application
let root = document.createElement("div");
root.id = 'main';
document.body.appendChild(root);
ReactDOM.render(
    <Buzzer />,
    document.getElementById("main")
);
