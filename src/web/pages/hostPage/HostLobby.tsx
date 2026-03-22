import * as React from "react";
import { JeffpardyHostController } from "./JeffpardyHostController";
import { Logger } from "../../utilities/Logger";
import { PlayerList } from "../../components/playerList/PlayerList";
import { TeamDictionary } from "../../Types";
import * as QRCode from "qrcode.react";
import { Attribution } from "../../components/attribution/Attribution";

export interface IHostLobbyProps {
    teams: TeamDictionary;
    gameCode: string;
    onStartGame: () => void;
}

export interface IHostLobbyState {
}

export class HostLobby extends React.Component<IHostLobbyProps, IHostLobbyState> {

    jeffpardyHostController: JeffpardyHostController;
    gameCode: string;
    customCategoryJSON: string;

    constructor(props: any) {
        super(props);

        this.state = {
        }
    }

    componentDidMount() {
        // Pre-cache all sound effects while in the lobby
        const sounds = [
            "/sounds/boardFill.mp3",
            "/sounds/dailyDouble.mp3",
            "/sounds/finalJeffpardyReveal.mp3",
            "/sounds/finalJeopardy.mp3"
        ];
        sounds.forEach(src => {
            const audio = new Audio(src);
            audio.load();
        });
    }

    public render() {
        Logger.debug("Lobby:render", this.props.teams);
        const playerUri: string = "https://" +
            window.location.hostname +
            (window.location.port != "" ? ":" + window.location.port : "") +
            "/player#" +
            this.props.gameCode;

        return (
            <div className="hostStartPage">
                <img src="/images/JeffpardyTitle.png" className="title" />
                <div className="gameCode">Game Code: { this.props.gameCode }</div>
                Give the above game code to the players or give them this direct link:<br />
                <a target="#" href={ playerUri }>{ playerUri }</a>
                <p />
                <div style={ { background: 'white', padding: '8px', display: 'inline-block', borderRadius: '4px' } }>
                    <QRCode.QRCodeCanvas
                        value={ playerUri }
                        size={ 180 }
                        includeMargin={ false } />
                </div>
                <div className="playerListBox">
                    <div className="boxTitle">Teams &amp; Players</div>
                    <i>When all players have joined, click the "Start Game" button below.</i>
                    <PlayerList teams={ this.props.teams } />
                </div>
                <button onClick={ this.props.onStartGame }>Start Game</button>
                <div className="flexGrowSpacer"></div>
                <Attribution />
            </div>
        );
    }
}
