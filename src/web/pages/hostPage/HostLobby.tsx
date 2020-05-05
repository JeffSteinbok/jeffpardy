import * as React from "react";
import * as ReactDOM from "react-dom";
import { JeffpardyHostController } from "./JeffpardyHostController";
import { JeffpardyBoard } from "./gameBoard/JeffpardyBoard";
import { Scoreboard } from "./scoreboard/Scoreboard";
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

    public render() {
        Logger.debug("Lobby:render", this.props.teams);
        let playerUri: string = "https://" +
            window.location.hostname +
            (window.location.port != "" ? ":" + window.location.port : "") +
            "/player#" +
            this.props.gameCode;

        return (
            <div className="hostStartPage">
                <div className="title">Jeffpardy!</div>
                <div className="gameCode">Use Game Code: { this.props.gameCode }</div>
                    Give the above game code to the players or give them this direct link:<br />
                <a target="#" href={ playerUri }>{ playerUri }</a>
                <p />
                <QRCode
                    value={ playerUri }
                    size={ 256 }
                    includeMargin={ true } />
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
