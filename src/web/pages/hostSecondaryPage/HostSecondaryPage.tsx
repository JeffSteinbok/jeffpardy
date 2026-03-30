// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { createRoot } from "react-dom/client";
import "../../Jeffpardy.css";
import * as signalR from "@microsoft/signalr";
import { Logger } from "../../utilities/Logger";
import { IClue, IPlayer, IBuzzerAttempt } from "../../Types";
import { sanitizeHtml } from "../../utilities/sanitize";
import { Debug } from "../../utilities/Debug";

import { IGameRound } from "../hostPage/Types";

enum HostSecondardyPageState {
    None,
    StartRound,
    ShowClue,
}

export type IHostSecondaryPageProps = Record<string, never>;

export interface IHostSecondaryPageState {
    hostSecondardyPageState: HostSecondardyPageState;
    hubConnection: signalR.HubConnection;
    gameCode: string;
    hostCode: string;
    clue: IClue;
    round: IGameRound;
    topBuzzers: IBuzzerAttempt[];
}

/**
 * Secondary Host Page
 */
export class HostSecondaryPage extends React.Component<IHostSecondaryPageProps, IHostSecondaryPageState> {
    constructor(props: IHostSecondaryPageProps) {
        super(props);

        const urlParams = new URLSearchParams(window.location.search);
        const debugParam: string = urlParams.get("debugMode");
        Debug.SetFlags(Number.parseInt(debugParam, 16));

        this.state = {
            hostSecondardyPageState: HostSecondardyPageState.None,
            gameCode: "",
            hostCode: "",
            clue: null,
            round: null,
            hubConnection: null,
            topBuzzers: [],
        };
    }

    componentDidMount = () => {
        const hubConnection: signalR.HubConnection = new signalR.HubConnectionBuilder()
            .withUrl("/hub/game")
            .withAutomaticReconnect()
            .build();

        this.setState({ hubConnection }, () => {
            this.state.hubConnection
                .start()
                .then(() => {
                    console.log("Connection started!");

                    if (window.location.hash.length == 13) {
                        const gameCode: string = window.location.hash.substring(1, 7);
                        const hostCode: string = window.location.hash.substring(7);

                        this.setState({
                            gameCode: gameCode,
                            hostCode: hostCode,
                        });

                        this.state.hubConnection
                            .invoke("connectHost", gameCode, hostCode)
                            .then(() => {
                                // Do something to say Connected!
                            })
                            .catch((err) => console.error(err));
                    }
                })
                .catch((_err) => console.log("Error while establishing connection :("));

            this.state.hubConnection.on("startRound", (round: IGameRound) => {
                Logger.debug("on startRound");

                // Rounds don't have names on the server for some reason.
                round.name = round.id == 0 ? "Jeffpardy" : round.id == 1 ? "Super Jeffpardy" : "Final Jeffpardy";

                this.setState({
                    hostSecondardyPageState: HostSecondardyPageState.StartRound,
                    round: round,
                });
            });

            this.state.hubConnection.on("showClue", (clue: IClue) => {
                Logger.debug("on showClue");

                this.setState({
                    hostSecondardyPageState: HostSecondardyPageState.ShowClue,
                    clue: clue,
                    topBuzzers: [],
                });
            });

            this.state.hubConnection.on(
                "assignWinner",
                (_user: IPlayer, _winningTime: number, topBuzzers: IBuzzerAttempt[]) => {
                    Logger.debug("on assignWinner", topBuzzers);
                    this.setState({ topBuzzers: topBuzzers || [] });
                }
            );

            this.state.hubConnection.on("resetBuzzer", () => {
                this.setState({ topBuzzers: [] });
            });
        });
    };

    componentWillUnmount() {
        this.state.hubConnection.stop();
    }

    public render() {
        return (
            <div id="hostSecondaryPage">
                <img src="/images/JeffpardyTitle.png" className="title" alt="Jeffpardy" />

                {this.state.hostSecondardyPageState == HostSecondardyPageState.None && (
                    <div>
                        The categories will show here when a new round start.
                        <br />
                        Clues and correct responses will be shown here when one is selected in the game board.
                    </div>
                )}
                {this.state.hostSecondardyPageState == HostSecondardyPageState.StartRound && (
                    <div>
                        <div className="roundName">{this.state.round.name} Round</div>
                        <ul className="categories">
                            {this.state.round.categories.map((category, index) => {
                                const airDate: Date = new Date(category.airDate);
                                return (
                                    <li key={index}>
                                        <div>
                                            <span className="categoryTitle">{category.title}</span>
                                            <span>
                                                {" "}
                                                -{" "}
                                                {airDate.getMonth() +
                                                    1 +
                                                    "/" +
                                                    airDate.getDate() +
                                                    "/" +
                                                    airDate.getFullYear()}
                                            </span>
                                        </div>
                                        <div>{category.comment}</div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
                {this.state.hostSecondardyPageState == HostSecondardyPageState.ShowClue && (
                    <div>
                        <div
                            className="clue"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(this.state.clue.clue) }}
                        />
                        <div
                            className="question"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(this.state.clue.question) }}
                        />
                    </div>
                )}
                {this.state.topBuzzers.length > 0 && (
                    <div className="buzzerResults">
                        {this.state.topBuzzers.map((attempt, i) => (
                            <div key={i} className={"buzzerResult" + (i === 0 ? " buzzerWinner" : "")}>
                                <span className="buzzerRank">{i === 0 ? "🏆" : i === 1 ? "🥈" : "🥉"}</span>
                                <span className="buzzerName">
                                    {attempt.player.name} ({attempt.player.team})
                                </span>
                                <span className="buzzerTime">{(attempt.time / 1000).toFixed(3)}s</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }
}

// Start the application
const root = document.createElement("div");
root.id = "main";
document.body.appendChild(root);
createRoot(document.getElementById("main")!).render(<HostSecondaryPage />);
