import * as React from "react";
import * as ReactDOM from "react-dom";
import * as signalR from "@microsoft/signalr";
import { Logger } from "../../utilities/Logger";
import { IPlayer, TeamDictionary } from "../../Types"
import { PlayerList } from "../../components/playerList/PlayerList";
import { ITeam } from "../../Types";

enum PlayerPageState {
    FrontPage,
    Lobby,
    Buzzer
}

export interface IPlayerPageProps {
}

export interface IPlayerPageState {
    gameCode: string;
    teams: TeamDictionary;
    logMessages: string[];
    hubConnection: signalR.HubConnection;
    name: string;
    team: string;
    playerPageState: PlayerPageState;
    buzzerActive: boolean;
    buzzerEarlyClickLock: boolean;
    buzzerLocked: boolean;
    buzzed: boolean;
    buzzedInUser: IPlayer;
    buzzedInUserReactionTime: number;
    isWinner: boolean;
    isTeamWinner: boolean;
    reactionTime: number;
}

/**
 * Root page for the player experience.
 */
export class PlayerPage extends React.Component<IPlayerPageProps, IPlayerPageState> {

    buzzerActivateTime: Date;
    gameCodeTemp: string = '';
    focusInput: HTMLInputElement = null;

    constructor(props: any) {
        super(props);

        this.state = {
            gameCode: '',
            teams: {},
            logMessages: [],
            hubConnection: null,
            name: '',
            team: '',
            playerPageState: PlayerPageState.FrontPage,
            buzzerActive: false,
            buzzerEarlyClickLock: false,
            buzzerLocked: false,
            buzzed: false,
            buzzedInUser: null,
            buzzedInUserReactionTime: 0,
            isWinner: false,
            isTeamWinner: false,
            reactionTime: 0
        };
    }

    componentDidMount = () => {
        if (this.focusInput != null) {
            this.focusInput.focus();
        }

        const hubConnection: signalR.HubConnection = new signalR.HubConnectionBuilder()
            .withUrl('/hub/buzzer')
            .withAutomaticReconnect()
            .build();

        this.setState({ hubConnection }, () => {
            this.state.hubConnection
                .start()
                .then(() => {
                    console.log('Connection started!');

                    if (window.location.hash.length == 7) {
                        this.gameCodeTemp = window.location.hash.substr(1);
                        this.setGameCode();
                    }
                })
                .catch(err => console.log('Error while establishing connection :('));

            this.state.hubConnection.on('updateUsers', (teams: { [key: string]: ITeam }) => {
                Logger.debug("Update Users: " + JSON.stringify(teams));
                this.setState({ teams: teams });
            });

            this.state.hubConnection.on('assignWinner', (user: IPlayer, reactionTime: number) => {
                Logger.debug("Winner Assigned " + JSON.stringify(user));

                this.setState({
                    buzzedInUser: user,
                    buzzedInUserReactionTime: reactionTime
                });
                // If I'm the winner, leave the buzzer at buzzed.
                // If not the winner, show it as locked out.
                if (this.state.hubConnection.connectionId == user.connectionId) {
                    this.setState({ isWinner: true })
                } else {
                    this.setState({ buzzerLocked: true });
                }

                if (this.state.team == user.team) {
                    this.setState({ isTeamWinner: true });
                }
            });

            this.state.hubConnection.on('resetBuzzer', (nick, receivedMessage) => {
                this.setState({
                    buzzed: false,
                    buzzerActive: false,
                    buzzerLocked: false,
                    buzzerEarlyClickLock: false,
                    buzzedInUser: null,
                    isWinner: false,
                    isTeamWinner: false,
                })
            });

            this.state.hubConnection.on('activateBuzzer', (nick, receivedMessage) => {
                this.buzzerActivateTime = new Date();
                Logger.debug("Buzzer activated at " + this.buzzerActivateTime.getTime())
                if (!this.state.isTeamWinner) {
                    this.setState({ buzzed: false });
                    this.setState({ buzzerLocked: false });
                    this.setState({ buzzedInUser: null });
                }
                this.setState({ buzzerActive: true });
            });
        });
    }

    registerPlayer = () => {
        if (this.state.name == "" || this.state.team == "") {
            alert("Please fill in a team name and player name.");
            return;
        }

        this.state.hubConnection
            .invoke('connectPlayer', this.state.gameCode, this.state.team, this.state.name)
            .then(() => this.setState({ playerPageState: PlayerPageState.Buzzer }))
            .catch(err => console.error(err));
    }


    setGameCode = () => {
        if (this.gameCodeTemp.length != 6) {
            alert("Please enter a 6 character game code.");
            return;
        }

        this.state.hubConnection
            .invoke('connectPlayerLobby', this.gameCodeTemp)
            .then(() => this.setState({
                gameCode: this.gameCodeTemp.toUpperCase(),
                playerPageState: PlayerPageState.Lobby
            }))
            .catch(err => console.error(err));
    }



    buzzIn = () => {
        if (this.state.buzzed) {
            Logger.debug("Buzzer clicked when already buzzed. Time:", new Date().getTime());
        } else if (this.state.buzzerLocked || this.state.buzzerEarlyClickLock) {
            Logger.debug("Buzzer clicked when locked. Time:", new Date().getTime());
        } else if (this.state.buzzerActive) {
            Logger.debug("Buzzer clicked when active. Time:", new Date().getTime());

            let reactionTime: number = new Date().getTime() - this.buzzerActivateTime.getTime();

            this.state.hubConnection
                .invoke('buzzIn', this.state.gameCode, reactionTime)
                .catch(err => console.error(err));
            this.setState({
                buzzed: true,
                reactionTime: reactionTime
            });
        } else {
            Logger.debug("Buzzer clicked when not active - applying lockout. Time:", new Date().getTime());

            // If buzzer isn't active yet, apply a 1s (2000ms) lockout
            if (!this.state.buzzerActive) {
                this.setState({ buzzerEarlyClickLock: true });

                setTimeout(() => {
                    Logger.debug("Lockout over. Time:", new Date().getTime());
                    this.setState({ buzzerEarlyClickLock: false });
                }, 2000);
            }
        }
    }

    componentWillUnmount() {
        this.state.hubConnection.stop();
    }

    public render() {
        let buzzerButtonText: string = "Buzz";
        let buzzerClassName: string = "inactive";
        let showBuzzerReactionTime: boolean = false;

        if (this.state.buzzerLocked || this.state.buzzerEarlyClickLock) {
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

        // If the user buzzed in then....
        if (this.state.buzzedInUserReactionTime != 0) {
            buzzerButtonText = "Buzzed";
            showBuzzerReactionTime = true;
        }

        return (



            <div id="playerPage">
                <div className="title">Jeffpardy! Buzzer</div>
                <div className="gameCode">{ this.state.gameCode }</div>

                { this.state.playerPageState == PlayerPageState.FrontPage &&
                    <div className="gameCodeEntry">
                        <h1>Enter Game Code</h1>
                        <input
                            type="text"
                            maxLength={ 6 }
                            onChange={ e => this.gameCodeTemp = e.target.value }
                            ref={ (input) => { this.focusInput = input; } }
                        />
                        <p />
                        <button onClick={ this.setGameCode }>Start</button>
                    </div>
                }
                { this.state.playerPageState != PlayerPageState.FrontPage &&
                    <div id="playerPageMain">
                        <div className="buzzerCurrentUserView">
                            { this.state.playerPageState == PlayerPageState.Lobby &&
                                <div>
                                    <h1>Register</h1>
                                    <div className="buzzerRegistration">
                                        <div>Team Name</div>
                                        <input
                                            type="text"
                                            maxLength={ 10 }
                                            value={ this.state.team }
                                            list="dataListTeam"
                                            ref={ (input) => { this.focusInput = input; } }
                                            onChange={ e => this.setState({ team: e.target.value.toUpperCase() }) }
                                        />

                                        <datalist id="dataListTeam">
                                            { Object.keys(this.state.teams).sort().map((teamName, key) =>
                                                <option key={ key } value={ teamName } />
                                            ) }
                                        </datalist>


                                        <p />
                                        <div>Player Name</div>
                                        <input
                                            type="text"
                                            maxLength={ 25 }
                                            value={ this.state.name }
                                            onChange={ e => this.setState({ name: e.target.value }) }
                                        />
                                        <p />
                                        <button onClick={ this.registerPlayer }>Start</button>
                                    </div>
                                </div>
                            }
                            { this.state.playerPageState == PlayerPageState.Buzzer &&
                                <div>
                                    <h1>{ this.state.name }</h1>
                                    <h2>Team: { this.state.team }</h2>

                                    <div><i>Wait for the button to turn green before buzzing in.</i></div>

                                    <button id="buzzer" className={ buzzerClassName } onMouseDown={ this.buzzIn }>
                                        <div>{ buzzerButtonText }</div>
                                        { showBuzzerReactionTime && <div className="reactionTime">{ this.state.reactionTime } ms</div> }
                                    </button>

                                    { this.state.buzzedInUser != null &&
                                        <div className={ "buzzedInUser " + (this.state.buzzedInUser.name == this.state.name ? " buzzedInWinner" : "") }>
                                            <div className="buzzedInUserTitle">Buzzed-in User</div>
                                            <div className="buzzedInUserName">{ this.state.buzzedInUser.name }</div>
                                            <div className="buzzedInUserTeam">Team: { this.state.buzzedInUser.team }</div>
                                            <div className="buzzedInUserTeam">Reaction Time: { this.state.buzzedInUserReactionTime } ms</div>
                                        </div>
                                    }
                                </div>
                            }
                        </div>

                        <div className="buzzerUserListView">
                            <h1>Current Players</h1>
                            <div>
                                <PlayerList teams={ this.state.teams } />
                            </div>
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
    <PlayerPage />,
    document.getElementById("main")
);
