import * as React from "react";
import * as ReactDOM from "react-dom";
import * as signalR from "@microsoft/signalr";
import { Logger } from "../../utilities/Logger";
import { IPlayer, TeamDictionary } from "../../Types"
import { PlayerList } from "../../components/playerList/PlayerList";
import { IClue } from "../../Types";
import { Debug } from "../../utilities/Debug";
import { Attribution } from "../../components/attribution/Attribution";
import { inherits } from "util";
import { IGameRound } from "../hostPage/Types";

enum HostSecondardyPageState {
    None,
    StartRound,
    ShowClue
}

export interface IHostSecondaryPageProps {
}

export interface IHostSecondaryPageState {
    hostSecondardyPageState: HostSecondardyPageState;
    hubConnection: signalR.HubConnection;
    gameCode: string;
    hostCode: string;
    clue: IClue;
    round: IGameRound;
}

/**
 * Secondary Host Page
 */
export class HostSecondaryPage extends React.Component<IHostSecondaryPageProps, IHostSecondaryPageState> {
    constructor(props: any) {
        super(props);

        const urlParams = new URLSearchParams(window.location.search);
        const debugParam: string = urlParams.get('debugMode');
        Debug.SetFlags(Number.parseInt(debugParam, 16));

        this.state = {
            hostSecondardyPageState: HostSecondardyPageState.None,
            gameCode: '',
            hostCode: '',
            clue: null,
            round: null,
            hubConnection: null,
        };
    }

    componentDidMount = () => {
        const hubConnection: signalR.HubConnection = new signalR.HubConnectionBuilder()
            .withUrl('/hub/game')
            .withAutomaticReconnect()
            .build();

        this.setState({ hubConnection }, () => {
            this.state.hubConnection
                .start()
                .then(() => {
                    console.log('Connection started!');

                    if (window.location.hash.length == 13) {
                        let gameCode: string = window.location.hash.substr(1, 6);
                        let hostCode: string = window.location.hash.substr(7);


                        this.setState({
                            gameCode: gameCode,
                            hostCode: hostCode
                        });

                        this.state.hubConnection
                            .invoke('connectHost', this.state.gameCode, this.state.hostCode)
                            .then(() => {
                                // Do something to say Connected!
                            })
                            .catch(err => console.error(err));
                    }
                })
                .catch(err => console.log('Error while establishing connection :('));

            this.state.hubConnection.on('startRound', (round: IGameRound) => {
                Logger.debug("on startRound");

                // Rounds don't have names on the server for some reason.
                round.name = round.id == 0 ? "Jeffpardy" : round.id == 1 ? "Super Jeffpardy" : "Final Jeffpardy";

                this.setState({
                    hostSecondardyPageState: HostSecondardyPageState.StartRound,
                    round: round
                })
            })

            this.state.hubConnection.on('showClue', (clue: IClue) => {
                Logger.debug("on showClue");

                this.setState({
                    hostSecondardyPageState: HostSecondardyPageState.ShowClue,
                    clue: clue,
                })
            })
        });
    }

    componentWillUnmount() {
        this.state.hubConnection.stop();
    }

    public render() {
        return (
            <div id="hostSecondaryPage">
                <div className="title">Jeffpardy!</div>

                { this.state.hostSecondardyPageState == HostSecondardyPageState.None &&
                    <div>
                        The categories will show here when a new round start.<br />
                        Clues and correct responses will be shown here when one is selected in the game board.
                    </div>
                }
                { this.state.hostSecondardyPageState == HostSecondardyPageState.StartRound &&
                    <div>
                        <div className="roundName">{ this.state.round.name } Round</div>
                        <ul className="categories">
                            {
                                this.state.round.categories.map((category, index) => {
                                    let airDate: Date = new Date(category.airDate);
                                    return (
                                        <li key={ index }>
                                            <div>
                                                <span className="categoryTitle">{ category.title }</span>
                                                <span> - { airDate.getMonth() + 1 + "/" + airDate.getDay() + "/" + airDate.getFullYear() }</span>
                                            </div>
                                            <div>{ category.comment }</div>
                                        </li>
                                    )
                                })
                            }
                        </ul>
                    </div>
                }
                { this.state.hostSecondardyPageState == HostSecondardyPageState.ShowClue &&
                    <div>
                        <div className="clue">{ this.state.clue.clue }</div>
                        <div className="question">{ this.state.clue.question }</div>
                    </div>
                }
            </div >
        );
    }
}


// Start the application
let root = document.createElement("div");
root.id = 'main';
document.body.appendChild(root);
ReactDOM.render(
    <HostSecondaryPage />,
    document.getElementById("main")
);
