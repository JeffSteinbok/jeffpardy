import * as React from "react";
import { ScoreboardEntry, ScoreboardEntryBuzzerState } from "./ScoreboardEntry";
import * as signalR from "@microsoft/signalr";
import { Logger } from "../../utilities/Logger";
import { IPlayer } from "../../../interfaces/IPlayer";
import { JeffpardyHostController } from "../../JeffpardyHostController";
import { Key, SpecialKey } from "../../utilities/Key";
import { timingSafeEqual } from "crypto";
import { HostPageViewMode } from "../../HostPage";

const connection = new signalR.HubConnectionBuilder()
    .withUrl("/hub/buzzer")
    .build();

connection.on("messageReceived", (username: string, message: string) => {
    let m = document.createElement("div");

    m.innerHTML =
        `<div class="message-author">${username}</div><div>${message}</div>`;

});

enum GameBoardState {
    Normal,
    Clue,
    Question
}

export interface IScoreboardProps {
    jeffpardyController: JeffpardyHostController;
}

export interface IScoreboardState {
    message: string;
    users: IPlayer[];
    teams: { [key: string]: IPlayer[] };
    scores: { [key: string]: number };
    logMessages: string[];
    hubConnection: signalR.HubConnection;
    connected: boolean;
    buzzerActive: boolean;
    buzzerLocked: boolean;
    buzzed: boolean;
    buzzedInUser: IPlayer;
    gameBoardState: GameBoardState;
    activeClueValue: number;
}

export interface IScoreboard {
    onClueShown: (clueValue: number) => void;
}
/**
 * Top bar containing toolbar buttons and drop downs
 */
export class Scoreboard extends React.Component<IScoreboardProps, IScoreboardState> implements IScoreboard {

    constructor(props: any) {
        super(props);

        this.props.jeffpardyController.setScoreboard(this);

        this.state = {
            message: '',
            users: [],
            teams: {},
            scores: {},
            logMessages: [],
            hubConnection: null,
            connected: false,
            buzzerActive: false,
            buzzerLocked: false,
            buzzed: false,
            buzzedInUser: null,
            gameBoardState: GameBoardState.Normal,
            activeClueValue: 0
        };
    }

    resetBuzzer = () => {
        if (this.state.buzzerActive) {
            this.state.hubConnection
                .invoke('resetBuzzer', "FOOBAR")
                .catch(err => console.error(err));
        }
    };

    activateBuzzer = () => {

        if (this.state.gameBoardState == GameBoardState.Clue && !this.state.buzzerActive) {

            this.state.hubConnection
                .invoke('activateBuzzer', "FOOBAR")
                .catch(err => console.error(err));
            this.setState({ message: '' });
        }
    };

    onClueShown = (clueValue: number) => {
        this.setState({
            gameBoardState: GameBoardState.Clue,
            activeClueValue: clueValue
        });
    };

    showQuestion = () => {
        if ((this.state.gameBoardState == GameBoardState.Clue) &&
            this.state.buzzerActive) {
            this.props.jeffpardyController.showQuestion();
            this.setState({ gameBoardState: GameBoardState.Question });
        }
        this.resetBuzzer();
    };

    showBoard = () => {
        if (this.state.gameBoardState == GameBoardState.Question) {
            this.props.jeffpardyController.showBoard();
            this.setState({ gameBoardState: GameBoardState.Normal });
        }
    };

    correctResponse = () => {
        this.processResponse(true);
    }

    incorrectResponse = () => {
        this.processResponse(false);
    }

    processResponse = (responseCorrect: Boolean) => {

        if ((this.state.buzzedInUser != null) && (this.state.activeClueValue != 0)) {
            let oldScore: number = 0;
            if (this.state.scores[this.state.buzzedInUser.team] != null) {
                oldScore = this.state.scores[this.state.buzzedInUser.team];
            }
            let adjustment: number = this.state.activeClueValue;

            if (responseCorrect) {
                this.showQuestion();
            }
            else {
                this.resetBuzzer();
                adjustment *= -1;
            }

            this.state.scores[this.state.buzzedInUser.team] = oldScore + adjustment;
            this.setState({ scores: this.state.scores });
        };
    }


    handleKeyDown = (event: KeyboardEvent) => {
        switch (event.keyCode) {
            case SpecialKey.SPACE:
                if (this.state.gameBoardState == GameBoardState.Clue)
                    this.showQuestion();
                else if (this.state.gameBoardState == GameBoardState.Question)
                    this.showBoard();
                break;
            case Key.R:
                this.resetBuzzer();
                break;
            case Key.A:
                this.activateBuzzer();
                break;
            case Key.Z:
                this.correctResponse();
                break;
            case Key.X:
                this.incorrectResponse();
                break;
        }
    }

    componentDidMount = () => {

        window.addEventListener("keydown", this.handleKeyDown)

        const hubConnection: signalR.HubConnection = new signalR.HubConnectionBuilder()
            .withUrl('/hub/buzzer')
            .build();

        this.setState({ hubConnection }, () => {
            this.state.hubConnection
                .start()
                .then(() => {
                    console.log('Connection started!');

                    this.state.hubConnection
                        .invoke('connectHost', "FOOBAR");
                })
                .catch(err => console.log('Error while establishing connection :('));

            this.state.hubConnection.on('updateUsers', (users: IPlayer[]) => {
                Logger.debug(JSON.stringify(users));
                this.setState({ "users": users });


                if (this.state.users.length > 0) {
                    let teams: { [key: string]: IPlayer[] } = this.state.users.reduce((acc, obj) => {
                        let k = obj.team;
                        if (!acc[k]) {
                            acc[k] = []
                        }
                        acc[k].push(obj);
                        return acc
                    },
                        {});


                    let scores: { [key: string]: number } = {};

                    for (var key in teams) {
                        if (teams.hasOwnProperty(key)) {
                            scores[key] = 0;
                        }
                    }

                    this.setState({
                        teams: teams,
                        scores: scores
                    });

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
        window.removeEventListener("keydown", this.handleKeyDown);
    }

    public render() {

        return (
            <div id="scoreboard">
                <div id="hostControls">
                    <div>Board:</div>
                    <div>
                        <button disabled={ this.state.gameBoardState != GameBoardState.Clue || !this.state.buzzerActive } onClick={ this.showQuestion }>Answer (sp)</button>
                        <button disabled={ this.state.gameBoardState != GameBoardState.Question } onClick={ this.showBoard }>Cont (sp)</button>
                    </div>
                    <div>Buzzer:</div>
                    <div>
                        <button disabled={ (this.state.gameBoardState != GameBoardState.Clue) || this.state.buzzerActive } onClick={ this.activateBuzzer }>Activate (a)</button>
                        <button disabled={ !this.state.buzzerActive } onClick={ this.resetBuzzer }>Reset (r)</button>
                    </div>
                    <div>Response:</div>
                    <div>
                        <button disabled={ this.state.buzzedInUser == null } onClick={ this.correctResponse }>Right (z)</button>
                        <button disabled={ this.state.buzzedInUser == null } onClick={ this.incorrectResponse }>Wrong (x)</button>
                    </div>
                    <div>Host Tools:</div>
                    <div>
                        <button onClick={ () => this.props.jeffpardyController.setViewMode(HostPageViewMode.HostCheatSheet) }>Show Answer Key</button>
                    </div>
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
                            <ScoreboardEntry key={ index } teamName={ teamName } buzzerState={ buzzerState } buzzedInUserName={ buzzedInUserName } score={ this.state.scores[teamName] } />
                        )
                    }) }
                </div>
            </div>
        );
    }
}
