import * as React from "react";
import * as ReactDOM from "react-dom";
import { JeffpardyHostController } from "./JeffpardyHostController";
import { JeffpardyBoard } from "./gameBoard/JeffpardyBoard";
import { Scoreboard } from "./scoreboard/Scoreboard";
import { Logger } from "../../utilities/Logger";
import { Debug, DebugFlags } from "../../utilities/Debug";
import { HostStartScreen } from "./hostStartScreen/HostStartScreen";
import { PlayerList } from "../../components/playerList/PlayerList";
import { ICategory, IGameData } from "./Types";
import { ITeam, TeamDictionary } from "../../Types";

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

        return (
            <div className="hostStartPage">
                <div className="title">Jeffpardy!</div>
                <div className="gameCode">Use Game Code: { this.props.gameCode }</div>
                    Give the above game code to the players or give them this direct link:<br />
                <a target="#" href={ "/player#" + this.props.gameCode }>https://{ window.location.hostname }{ window.location.port != "" ? ":" + window.location.port : "" }/player#{ this.props.gameCode }</a>


                <PlayerList teams={ this.props.teams } />
                <button onClick={ this.props.onStartGame }>Start Game</button>
            </div>
        );
    }
}
