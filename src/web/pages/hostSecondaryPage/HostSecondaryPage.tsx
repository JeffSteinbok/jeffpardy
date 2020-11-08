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

export interface IHostSecondaryPageProps {
}

export interface IHostSecondaryPageState {
    hubConnection: signalR.HubConnection;
    gameCode: string;
    hostCode: string;
    clue: IClue;
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
            gameCode: '',
            hostCode: '',
            clue: null,
            hubConnection: null,
        };
    }

    componentDidMount = () => {
        const hubConnection: signalR.HubConnection = new signalR.HubConnectionBuilder()
            .withUrl('/hub/buzzer')
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

            this.state.hubConnection.on('showClue', (clue: IClue) => {
                Logger.debug("on showClue");

                this.setState({
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

                { this.state.clue == null &&
                    <div>
                        The clue and correct response will be shown here when one is selected in the game board.
                    </div>
                }
                { this.state.clue != null &&
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
