import * as React from "react";
import * as ReactDOM from "react-dom";
import * as signalR from "@microsoft/signalr";
import { Logger } from "../../utilities/Logger";
import { IPlayer, TeamDictionary } from "../../Types"
import { PlayerList } from "../../components/playerList/PlayerList";
import { ITeam } from "../../Types";
import { Debug } from "../../utilities/Debug";
import { SpecialKey } from "../../utilities/Key";
import { Attribution } from "../../components/attribution/Attribution";
import { inherits } from "util";

enum PlayerPageState {
    FrontPage,
    Lobby,
    Buzzer,
    FinalJeffpardy
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
    finalJeffpardyMaxWager: number;
    finalJeffpardyWager: number;
    finalJeffpardyAnswer: string;
    finalJeffpardyWagerEnabled: boolean;
    finalJeffpardyAnswerEnabled: boolean;
}

/**
 * Root page for the player experience.
 */
export class PlayerPage extends React.Component<IPlayerPageProps, IPlayerPageState> {

    buzzerActivateTime: Date;
    gameCodeTemp: string = '';
    handicap: number = 0;
    finalJeffpardyWagerTemp: number = 0;
    finalJeffpardyAnswerTemp: string = "";
    finalJeffpardyClueShownTime: Date;

    teamTemp: string = "";
    nameTemp: string = "";

    constructor(props: any) {
        super(props);

        const urlParams = new URLSearchParams(window.location.search);
        const debugParam: string = urlParams.get('debugMode');
        Debug.SetFlags(Number.parseInt(debugParam, 16));

        this.state = {
            gameCode: '',
            teams: {},
            logMessages: [],
            hubConnection: null,
            name: null,
            team: null,
            playerPageState: PlayerPageState.FrontPage,
            buzzerActive: false,
            buzzerEarlyClickLock: false,
            buzzerLocked: false,
            buzzed: false,
            buzzedInUser: null,
            buzzedInUserReactionTime: 0,
            isWinner: false,
            isTeamWinner: false,
            reactionTime: 0,
            finalJeffpardyMaxWager: 0,
            finalJeffpardyWager: -1,
            finalJeffpardyAnswer: null,
            finalJeffpardyWagerEnabled: true,
            finalJeffpardyAnswerEnabled: true,
        };
    }

    componentDidMount = () => {
        window.addEventListener("keydown", this.handleKeyDown);

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


            this.state.hubConnection.on('startFinalJeffpardy', (scores: { [key: string]: number }) => {
                Logger.debug("on startFinalJeffpardy", this.state.team);

                // If not registered yet, bail
                if (this.state.team == null) {
                    return;
                }

                // Get the max wager for this team.
                // If negative, then 0
                let maxWager: number = Math.max(scores[this.state.team], 0);

                this.setState({
                    playerPageState: PlayerPageState.FinalJeffpardy,
                    finalJeffpardyMaxWager: maxWager
                })
            })

            this.state.hubConnection.on('showFinalJeffpardyClue', () => {
                this.finalJeffpardyClueShownTime = new Date();
                Logger.debug("on showFinalJeffpardyClue");

                // If not registered yet, bail
                if (this.state.team == null) {
                    return;
                }

                this.setState({
                    playerPageState: PlayerPageState.FinalJeffpardy,
                    finalJeffpardyWagerEnabled: false
                })
            })

            this.state.hubConnection.on('endFinalJeffpardy', () => {
                Logger.debug("on endFinalJeffpardy");

                // If not registered yet, bail
                if (this.state.team == null) {
                    return;
                }

                this.setState({
                    playerPageState: PlayerPageState.FinalJeffpardy,
                    finalJeffpardyWagerEnabled: false,
                    finalJeffpardyAnswerEnabled: false
                })
            })
        });
    }

    registerPlayer = () => {
        if (this.nameTemp == "" || this.teamTemp == "") {
            alert("Please fill in a team name and player name.");
            return;
        }

        this.setState({
            name: this.nameTemp,
            team: this.teamTemp
        });

        this.state.hubConnection
            .invoke('connectPlayer', this.state.gameCode, this.teamTemp, this.nameTemp)
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
            reactionTime += this.handicap;

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

    submitFinalJeffpardyWager = () => {

        let fjBet = this.finalJeffpardyWagerTemp;
        if (isNaN(fjBet) || fjBet > this.state.finalJeffpardyMaxWager || fjBet < 0) {
            alert("Please enter a wager between 0 and " + this.state.finalJeffpardyMaxWager + ".");
            return;
        } else {
            this.state.hubConnection
                .invoke('submitWager', this.state.gameCode, this.finalJeffpardyWagerTemp)
                .catch(err => console.error(err));

            this.setState({
                finalJeffpardyWager: this.finalJeffpardyWagerTemp,
                finalJeffpardyWagerEnabled: false
            })
        }
    }

    submitFinalJeffpardyAnswer = () => {
        if (this.finalJeffpardyClueShownTime == null) {
            alert("You can't submit your answer before the clue is shown.");
            return;
        }

        let reactionTime: number = new Date().getTime() - this.finalJeffpardyClueShownTime.getTime();

        this.state.hubConnection
            .invoke('submitAnswer', this.state.gameCode, this.finalJeffpardyAnswerTemp, reactionTime)
            .catch(err => console.error(err));

        this.setState({
            finalJeffpardyAnswer: this.finalJeffpardyAnswerTemp,
            finalJeffpardyAnswerEnabled: false
        })
    }

    handleKeyDown = (event: KeyboardEvent) => {
        switch (event.keyCode) {
            case SpecialKey.SPACE:
                this.buzzIn();
                break;
        }
    }

    componentWillUnmount() {
        window.removeEventListener("keydown", this.handleKeyDown);
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
                <div className="title">Jeffpardy!</div>
                <div className="gameCode">{ this.state.gameCode }</div>

                { this.state.playerPageState == PlayerPageState.FrontPage &&
                    <div className="gameCodeEntry">
                        <h1>Enter Game Code</h1>
                        <form
                            onSubmit={ (e) => { e.preventDefault(); this.setGameCode() } } >
                            <input
                                autoFocus
                                type="text"
                                maxLength={ 6 }
                                onChange={ e => this.gameCodeTemp = e.target.value }
                            />
                            <p />
                            <button type="submit">Start</button>
                        </form>
                        <div className="flexGrowSpacer" />
                    </div>
                }
                {
                    this.state.playerPageState != PlayerPageState.FrontPage &&
                    <div id="playerPageMain">
                        <div className="buzzerCurrentUserView">
                            { this.state.playerPageState == PlayerPageState.Lobby &&
                                <div>
                                    <h1>Register</h1>
                                    <div className="buzzerRegistration">
                                        <form
                                            onSubmit={ (e) => { e.preventDefault(); this.registerPlayer() } } >
                                            <div>Team Name</div>
                                            <input
                                                autoFocus
                                                type="text"
                                                maxLength={ 10 }
                                                list="dataListTeam"
                                                onChange={ e => { this.teamTemp = e.target.value } }
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
                                                onChange={ e => { this.nameTemp = e.target.value } }
                                            />
                                            <p />
                                            <button type="submit">Start</button>
                                        </form>
                                    </div>
                                </div>
                            }
                            { this.state.playerPageState == PlayerPageState.Buzzer &&
                                <div>
                                    <h1>{ this.state.name }</h1>
                                    <h2>Team: { this.state.team }</h2>

                                    <div><i>Wait for the button to turn green before buzzing in.<br />
                                            Click, touch or press SPACE to activate.</i></div>

                                    <button id="buzzer" className={ buzzerClassName } onMouseDown={ this.buzzIn }>
                                        <div>{ buzzerButtonText }</div>
                                        { showBuzzerReactionTime && <div className="reactionTime">{ this.state.reactionTime } ms</div> }
                                    </button>

                                    <div style={ { paddingTop: 10 } } >
                                        Buzzer handicap:
                                    <select id="handicap" onChange={ (e) => this.handicap = Number.parseInt(e.target.value, 10) }>
                                            <option value="0">0 ms</option>
                                            <option value="50">50 ms</option>
                                            <option value="100">100 ms</option>
                                            <option value="150">150 ms</option>
                                            <option value="200">200 ms</option>
                                            <option value="250">250 ms</option>
                                            <option value="300">300 ms</option>
                                        </select>
                                    </div>
                                    <div><i>This will slow you buzzer down if you're kicking too much ass.</i></div>

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
                            { this.state.playerPageState == PlayerPageState.FinalJeffpardy &&
                                <div className="finalJeffpardy">
                                    <h1>{ this.state.name }</h1>
                                    <h2>Team: { this.state.team }</h2>
                                    <div>Wager Amount</div>
                                    <input
                                        type="number"
                                        min={ 0 }
                                        max={ this.state.finalJeffpardyMaxWager }
                                        step={ 100 }
                                        onChange={ e => { this.finalJeffpardyWagerTemp = Number.parseInt(e.target.value, 10) } }
                                        disabled={ !this.state.finalJeffpardyWagerEnabled } />
                                    <div><i>Enter a value up to { this.state.finalJeffpardyMaxWager }.</i></div>
                                    { this.state.finalJeffpardyWagerEnabled &&
                                        <button onClick={ this.submitFinalJeffpardyWager }>Submit Wager</button>
                                    }
                                    { !this.state.finalJeffpardyWagerEnabled &&
                                        <div>Wager Locked</div>
                                    }
                                    <p />
                                    { this.state.finalJeffpardyWager >= 0 &&
                                        <div>
                                            <div>Answer</div>
                                            <input
                                                disabled={ !this.state.finalJeffpardyAnswerEnabled }
                                                onChange={ e => { this.finalJeffpardyAnswerTemp = e.target.value } } />
                                            <br />
                                            { this.state.finalJeffpardyAnswerEnabled &&
                                                <button onClick={ this.submitFinalJeffpardyAnswer }>Submit Answer</button>
                                            }
                                            { !this.state.finalJeffpardyAnswerEnabled &&
                                                this.state.finalJeffpardyAnswer != null &&

                                                <div>Answer Submitted</div>
                                            }
                                            { !this.state.finalJeffpardyAnswerEnabled &&
                                                this.state.finalJeffpardyAnswer == null &&

                                                <div>Answer Not Submitted in Time</div>
                                            }
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

                <Attribution />
            </div >
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
