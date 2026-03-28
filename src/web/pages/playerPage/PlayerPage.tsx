// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { createRoot } from "react-dom/client";
import "../../Jeffpardy.css";
import * as signalR from "@microsoft/signalr";
import { Logger } from "../../utilities/Logger";
import { IPlayer, TeamDictionary } from "../../Types";
import { PlayerList } from "../../components/playerList/PlayerList";
import { ITeam } from "../../Types";
import { Debug } from "../../utilities/Debug";
import { SpecialKey } from "../../utilities/Key";
import { Attribution } from "../../components/attribution/Attribution";

enum PlayerPageState {
    FrontPage,
    Lobby,
    Buzzer,
    FinalJeffpardy,
}

export type IPlayerPageProps = Record<string, never>;

enum ConnectionStatus {
    Connected,
    Reconnecting,
    Disconnected,
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
    finalJeffpardyScores: { [key: string]: number };
    scores: { [key: string]: number };
    lockedInPlayerIds: string[];
    gameCodeInputLength: number;
    toastMessage: string; // Transient notification text; auto-clears after 3s via showToast
    connectionStatus: ConnectionStatus;
}

/**
 * Root page for the player experience.
 */
export class PlayerPage extends React.Component<IPlayerPageProps, IPlayerPageState> {
    buzzerActivateTime: Date;
    gameCodeTemp: string = "";
    handicap: number = 0;
    finalJeffpardyWagerTemp: number = 0;
    finalJeffpardyAnswerTemp: string = "";
    finalJeffpardyClueShownTime: Date;

    teamTemp: string = "";
    nameTemp: string = "";
    visibilityHandler: (() => void) | null = null;
    manualReconnectTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(props: IPlayerPageProps) {
        super(props);

        const urlParams = new URLSearchParams(window.location.search);
        const debugParam: string = urlParams.get("debugMode");
        Debug.SetFlags(Number.parseInt(debugParam, 16));

        this.state = {
            gameCode: "",
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
            finalJeffpardyScores: null,
            scores: null,
            lockedInPlayerIds: [],
            gameCodeInputLength: 0,
            toastMessage: null,
            connectionStatus: ConnectionStatus.Connected,
        };
    }

    // Display a brief notification overlay that auto-dismisses after 3 seconds
    showToast = (message: string) => {
        this.setState({ toastMessage: message });
        setTimeout(() => {
            this.setState({ toastMessage: null });
        }, 3000);
    };

    componentDidMount = () => {
        window.addEventListener("keydown", this.handleKeyDown);

        const hubConnection: signalR.HubConnection = new signalR.HubConnectionBuilder()
            .withUrl("/hub/game")
            .withAutomaticReconnect()
            .build();

        this.setState({ hubConnection }, () => {
            this.state.hubConnection
                .start()
                .then(() => {
                    console.log("Connection started!");

                    if (window.location.hash.length == 7) {
                        this.gameCodeTemp = window.location.hash.substr(1);
                        this.setGameCode();
                    }
                })
                .catch((_err) => console.log("Error while establishing connection :("));

            this.state.hubConnection.on("updateUsers", (teams: { [key: string]: ITeam }) => {
                Logger.debug("Update Users: " + JSON.stringify(teams));
                this.setState({ teams: teams });
            });

            this.state.hubConnection.on("broadcastScores", (scores: { [key: string]: number }) => {
                Logger.debug("Broadcast Scores: " + JSON.stringify(scores));
                this.setState({ scores: scores });
            });

            this.state.hubConnection.on("assignWinner", (user: IPlayer, reactionTime: number) => {
                Logger.debug("Winner Assigned " + JSON.stringify(user));

                this.setState({
                    buzzedInUser: user,
                    buzzedInUserReactionTime: reactionTime,
                });
                // If I'm the winner, leave the buzzer at buzzed.
                // If not the winner, show it as locked out.
                if (this.state.hubConnection.connectionId == user.connectionId) {
                    this.setState({ isWinner: true });
                } else {
                    this.setState({ buzzerLocked: true });
                }

                if (this.state.team == user.team) {
                    this.setState({ isTeamWinner: true });
                }
            });

            this.state.hubConnection.on("resetBuzzer", (_nick: string, _receivedMessage: string) => {
                this.setState({
                    buzzed: false,
                    buzzerActive: false,
                    buzzerLocked: false,
                    buzzerEarlyClickLock: false,
                    buzzedInUser: null,
                    isWinner: false,
                    isTeamWinner: false,
                });
            });

            this.state.hubConnection.on("activateBuzzer", (_nick: string, _receivedMessage: string) => {
                this.buzzerActivateTime = new Date();
                Logger.debug("Buzzer activated at " + this.buzzerActivateTime.getTime());
                if (!this.state.isTeamWinner) {
                    this.setState({ buzzed: false });
                    this.setState({ buzzerLocked: false });
                    this.setState({ buzzedInUser: null });
                }
                this.setState({ buzzerActive: true });
            });

            this.state.hubConnection.on("startFinalJeffpardy", (scores: { [key: string]: number }) => {
                Logger.debug("on startFinalJeffpardy", this.state.team);

                // If not registered yet, bail
                if (this.state.team == null) {
                    return;
                }

                // Get the max wager for this team.
                // If negative, then 0
                const maxWager: number = Math.max(scores[this.state.team], 0);

                this.setState({
                    playerPageState: PlayerPageState.FinalJeffpardy,
                    finalJeffpardyMaxWager: maxWager,
                    finalJeffpardyScores: scores,
                    scores: scores,
                });

                // If max wager is 0, just set it.
                if (maxWager == 0) {
                    this.finalJeffpardyWagerTemp = 0;
                    this.submitFinalJeffpardyWager();
                }
            });

            this.state.hubConnection.on("showFinalJeffpardyClue", () => {
                this.finalJeffpardyClueShownTime = new Date();
                Logger.debug("on showFinalJeffpardyClue");

                // If not registered yet, bail
                if (this.state.team == null) {
                    return;
                }

                this.setState({
                    playerPageState: PlayerPageState.FinalJeffpardy,
                    finalJeffpardyWagerEnabled: false,
                });
            });

            this.state.hubConnection.on("endFinalJeffpardy", () => {
                Logger.debug("on endFinalJeffpardy");

                // If not registered yet, bail
                if (this.state.team == null) {
                    return;
                }

                this.setState({
                    playerPageState: PlayerPageState.FinalJeffpardy,
                    finalJeffpardyWagerEnabled: false,
                    finalJeffpardyAnswerEnabled: false,
                });
            });

            this.state.hubConnection.on("wagerLockedIn", (connectionId: string) => {
                Logger.debug("on wagerLockedIn", connectionId);
                this.setState({
                    lockedInPlayerIds: [...this.state.lockedInPlayerIds, connectionId],
                });
            });

            this.state.hubConnection.onreconnecting(() => {
                Logger.debug("Connection reconnecting...");
                this.setState({ connectionStatus: ConnectionStatus.Reconnecting });
            });

            this.state.hubConnection.onreconnected(() => {
                Logger.debug("Connection reconnected");
                this.setState({ connectionStatus: ConnectionStatus.Connected });
                this.reregisterWithGame();
            });

            this.state.hubConnection.onclose(() => {
                Logger.debug("Connection closed");
                this.setState({ connectionStatus: ConnectionStatus.Disconnected });
                this.startManualReconnect();
            });
        });
    };

    reregisterWithGame = () => {
        if (this.state.gameCode && this.state.name && this.state.team) {
            this.state.hubConnection
                .invoke("connectPlayer", this.state.gameCode, this.state.team, this.state.name)
                .catch((err) => console.error("Failed to re-register player:", err));
        } else if (this.state.gameCode) {
            this.state.hubConnection
                .invoke("connectPlayerLobby", this.state.gameCode)
                .catch((err) => console.error("Failed to re-register in lobby:", err));
        }
    };

    startManualReconnect = () => {
        this.cleanupReconnectListeners();

        this.visibilityHandler = () => {
            if (document.visibilityState === "visible") {
                this.attemptReconnect();
            }
        };
        document.addEventListener("visibilitychange", this.visibilityHandler);

        // If page is already visible, try immediately
        if (document.visibilityState === "visible") {
            this.attemptReconnect();
        }
    };

    attemptReconnect = () => {
        if (this.state.hubConnection.state === signalR.HubConnectionState.Connected) {
            return;
        }
        this.setState({ connectionStatus: ConnectionStatus.Reconnecting });
        this.state.hubConnection
            .start()
            .then(() => {
                Logger.debug("Manual reconnect succeeded");
                this.cleanupReconnectListeners();
                this.setState({ connectionStatus: ConnectionStatus.Connected });
                this.reregisterWithGame();
            })
            .catch(() => {
                Logger.debug("Manual reconnect failed, retrying in 5s");
                this.manualReconnectTimer = setTimeout(() => this.attemptReconnect(), 5000);
            });
    };

    cleanupReconnectListeners = () => {
        if (this.visibilityHandler) {
            document.removeEventListener("visibilitychange", this.visibilityHandler);
            this.visibilityHandler = null;
        }
        if (this.manualReconnectTimer) {
            clearTimeout(this.manualReconnectTimer);
            this.manualReconnectTimer = null;
        }
    };

    registerPlayer = () => {
        if (this.nameTemp == "" || this.teamTemp == "") {
            this.showToast("Please fill in a team name and player name.");
            return;
        }

        this.setState({
            name: this.nameTemp,
            team: this.teamTemp,
        });

        this.state.hubConnection
            .invoke("connectPlayer", this.state.gameCode, this.teamTemp, this.nameTemp)
            .then(() => this.setState({ playerPageState: PlayerPageState.Buzzer }))
            .catch((err) => console.error(err));
    };

    setGameCode = () => {
        if (this.gameCodeTemp.length != 6) {
            this.showToast("Please enter a 6 character game code.");
            return;
        }

        this.state.hubConnection
            .invoke("connectPlayerLobby", this.gameCodeTemp)
            .then(() =>
                this.setState({
                    gameCode: this.gameCodeTemp.toUpperCase(),
                    playerPageState: PlayerPageState.Lobby,
                })
            )
            .catch((err) => console.error(err));
    };

    buzzIn = () => {
        if (this.state.buzzed) {
            Logger.debug("Buzzer clicked when already buzzed. Time:", new Date().getTime());
        } else if (this.state.buzzerLocked || this.state.buzzerEarlyClickLock) {
            Logger.debug("Buzzer clicked when locked. Time:", new Date().getTime());
        } else if (this.state.buzzerActive) {
            Logger.debug("Buzzer clicked when active. Time:", new Date().getTime());

            const reactionTime: number = new Date().getTime() - this.buzzerActivateTime.getTime();

            this.state.hubConnection
                .invoke("buzzIn", this.state.gameCode, reactionTime, this.handicap)
                .catch((err) => console.error(err));
            this.setState({
                buzzed: true,
                reactionTime: reactionTime + this.handicap,
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
    };

    submitFinalJeffpardyWager = () => {
        const fjBet = this.finalJeffpardyWagerTemp;
        if (this.state.finalJeffpardyWagerEnabled) {
            if (isNaN(fjBet) || fjBet > this.state.finalJeffpardyMaxWager || fjBet < 0) {
                this.showToast("Please enter a wager between 0 and " + this.state.finalJeffpardyMaxWager + ".");
                return;
            } else {
                this.state.hubConnection
                    .invoke("submitWager", this.state.gameCode, this.finalJeffpardyWagerTemp)
                    .catch((err) => console.error(err));

                this.setState({
                    finalJeffpardyWager: this.finalJeffpardyWagerTemp,
                    finalJeffpardyWagerEnabled: false,
                });
            }
        }
    };

    submitFinalJeffpardyAnswer = () => {
        if (this.state.finalJeffpardyAnswerEnabled) {
            if (this.finalJeffpardyClueShownTime == null) {
                this.showToast("You can't submit your response before the clue is shown.");
                return;
            }

            const reactionTime: number = new Date().getTime() - this.finalJeffpardyClueShownTime.getTime();

            this.state.hubConnection
                .invoke("submitAnswer", this.state.gameCode, this.finalJeffpardyAnswerTemp, reactionTime)
                .catch((err) => console.error(err));

            this.setState({
                finalJeffpardyAnswer: this.finalJeffpardyAnswerTemp,
                finalJeffpardyAnswerEnabled: false,
            });
        }
    };

    handleKeyDown = (event: KeyboardEvent) => {
        switch (event.keyCode) {
            case SpecialKey.SPACE:
                this.buzzIn();
                break;
        }
    };

    componentWillUnmount() {
        window.removeEventListener("keydown", this.handleKeyDown);
        this.cleanupReconnectListeners();
        this.state.hubConnection.stop();
    }

    public render() {
        let buzzerButtonText: string = "Buzz";
        let buzzerClassName: string;
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
                {this.state.toastMessage && <div className="toast">{this.state.toastMessage}</div>}
                {this.state.connectionStatus !== ConnectionStatus.Connected && (
                    <div className="connectionBanner">
                        {this.state.connectionStatus === ConnectionStatus.Reconnecting
                            ? "Reconnecting..."
                            : "Disconnected — waiting for network..."}
                    </div>
                )}
                <img src="/images/JeffpardyTitle.png" className="title" />
                <div className="gameCode jeffpardy-label">{this.state.gameCode}</div>

                {this.state.playerPageState == PlayerPageState.FrontPage && (
                    <div className="gameCodeEntry">
                        <h1>Enter Game Code</h1>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                this.setGameCode();
                            }}
                        >
                            <input
                                autoFocus
                                type="text"
                                maxLength={6}
                                onChange={(e) => {
                                    this.gameCodeTemp = e.target.value;
                                    this.setState({ gameCodeInputLength: e.target.value.length });
                                }}
                            />
                            <p />
                            <button type="submit" disabled={this.state.gameCodeInputLength !== 6}>
                                Start
                            </button>
                        </form>
                        <div className="flexGrowSpacer" />
                    </div>
                )}
                {this.state.playerPageState != PlayerPageState.FrontPage && (
                    <div id="playerPageMain">
                        <div className="buzzerCurrentUserView">
                            {this.state.playerPageState == PlayerPageState.Lobby && (
                                <div>
                                    <h1>Register</h1>
                                    <div className="buzzerRegistration">
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                this.registerPlayer();
                                            }}
                                        >
                                            <div>Team Name</div>
                                            <input
                                                autoFocus
                                                type="text"
                                                maxLength={10}
                                                list="dataListTeam"
                                                onChange={(e) => {
                                                    this.teamTemp = e.target.value;
                                                }}
                                            />

                                            <datalist id="dataListTeam">
                                                {Object.keys(this.state.teams)
                                                    .sort()
                                                    .map((teamName, key) => (
                                                        <option key={key} value={teamName} />
                                                    ))}
                                            </datalist>

                                            <p />
                                            <div>Player Name</div>
                                            <input
                                                type="text"
                                                maxLength={25}
                                                value={this.state.name}
                                                onChange={(e) => {
                                                    this.nameTemp = e.target.value;
                                                }}
                                            />
                                            <p />
                                            <button type="submit">Start</button>
                                        </form>
                                    </div>
                                </div>
                            )}
                            {this.state.playerPageState == PlayerPageState.Buzzer && (
                                <div>
                                    <h1>{this.state.name}</h1>
                                    <h2>{this.state.team}</h2>

                                    <div className="buzzerHint">
                                        Wait for the button to turn green before buzzing in.
                                        <br />
                                        Click, touch or press SPACE to activate.
                                    </div>

                                    <button id="buzzer" className={buzzerClassName} onMouseDown={this.buzzIn}>
                                        <div>{buzzerButtonText}</div>
                                        {showBuzzerReactionTime && (
                                            <div className="reactionTime">{this.state.reactionTime} ms</div>
                                        )}
                                    </button>

                                    <div className="handicapSection">
                                        Handicap:
                                        <select
                                            id="handicap"
                                            onChange={(e) => (this.handicap = Number.parseInt(e.target.value, 10))}
                                        >
                                            <option value="0">0 ms</option>
                                            <option value="50">50 ms</option>
                                            <option value="100">100 ms</option>
                                            <option value="150">150 ms</option>
                                            <option value="200">200 ms</option>
                                            <option value="250">250 ms</option>
                                            <option value="300">300 ms</option>
                                        </select>
                                    </div>

                                    {this.state.buzzedInUser != null && (
                                        <div
                                            className={
                                                "buzzedInUser " +
                                                (this.state.buzzedInUser.name == this.state.name
                                                    ? " buzzedInWinner"
                                                    : "")
                                            }
                                        >
                                            <div className="buzzedInUserTitle">Buzzed In</div>
                                            <div className="buzzedInUserName">{this.state.buzzedInUser.name}</div>
                                            <div className="buzzedInUserTeam">{this.state.buzzedInUser.team}</div>
                                            <div className="buzzedInUserTeam">
                                                {this.state.buzzedInUserReactionTime} ms
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {this.state.playerPageState == PlayerPageState.FinalJeffpardy && (
                                <div className="finalJeffpardy">
                                    <h1>{this.state.name}</h1>
                                    <h2>Team: {this.state.team}</h2>
                                    <div>Wager Amount</div>
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            this.submitFinalJeffpardyWager();
                                        }}
                                    >
                                        <input
                                            autoFocus
                                            type="number"
                                            min={0}
                                            max={this.state.finalJeffpardyMaxWager}
                                            onChange={(e) => {
                                                this.finalJeffpardyWagerTemp = Number.parseInt(e.target.value, 10);
                                            }}
                                            disabled={!this.state.finalJeffpardyWagerEnabled}
                                            defaultValue={this.state.finalJeffpardyMaxWager == 0 ? "0" : ""}
                                        />
                                        {this.state.finalJeffpardyMaxWager > 0 && (
                                            <div>
                                                <i>Enter a value up to {this.state.finalJeffpardyMaxWager}.</i>
                                            </div>
                                        )}
                                        {this.state.finalJeffpardyWagerEnabled && (
                                            <button type="submit">Submit Wager</button>
                                        )}
                                        {!this.state.finalJeffpardyWagerEnabled && <div>Wager Locked 🔒</div>}
                                    </form>
                                    {this.state.finalJeffpardyWager >= 0 && <div className="finalTallyDivider"></div>}
                                    {this.state.finalJeffpardyWager >= 0 && (
                                        <div>
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    this.submitFinalJeffpardyAnswer();
                                                }}
                                            >
                                                <div>Response</div>
                                                <input
                                                    autoFocus
                                                    disabled={!this.state.finalJeffpardyAnswerEnabled}
                                                    onChange={(e) => {
                                                        this.finalJeffpardyAnswerTemp = e.target.value;
                                                    }}
                                                />
                                                <br />
                                                {this.state.finalJeffpardyAnswerEnabled && (
                                                    <button type="submit">Submit Response</button>
                                                )}
                                                {!this.state.finalJeffpardyAnswerEnabled &&
                                                    this.state.finalJeffpardyAnswer != null && (
                                                        <div>Response Submitted</div>
                                                    )}
                                                {!this.state.finalJeffpardyAnswerEnabled &&
                                                    this.state.finalJeffpardyAnswer == null && (
                                                        <div>Response Not Submitted in Time</div>
                                                    )}
                                            </form>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="buzzerUserListView">
                            <h1>{this.state.scores ? "Scores" : "Current Players"}</h1>
                            <div>
                                <PlayerList
                                    teams={this.state.teams}
                                    scores={this.state.scores}
                                    lockedInPlayerIds={this.state.lockedInPlayerIds}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <Attribution />
            </div>
        );
    }
}

// Start the application
const root = document.createElement("div");
root.id = "main";
document.body.appendChild(root);
const reactRoot = createRoot(root);
reactRoot.render(<PlayerPage />);
