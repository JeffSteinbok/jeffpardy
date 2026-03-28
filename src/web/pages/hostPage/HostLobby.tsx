// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { Logger } from "../../utilities/Logger";
import { PlayerList } from "../../components/playerList/PlayerList";
import { TeamDictionary } from "../../Types";
import * as QRCode from "qrcode.react";
import { Attribution } from "../../components/attribution/Attribution";

import { SpecialKey } from "../../utilities/Key";

export interface IHostLobbyProps {
    teams: TeamDictionary;
    gameCode: string;
    onStartGame: () => void;
    onBack: () => void;
}

/** Lobby screen shown after game setup, displaying the game code, player join link, and player list before the game starts. */
export class HostLobby extends React.Component<IHostLobbyProps> {
    private handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === SpecialKey.ENTER) {
            this.props.onStartGame();
        }
    };

    componentDidMount() {
        window.addEventListener("keydown", this.handleKeyDown);

        // Pre-cache all sound effects while in the lobby
        const sounds = [
            "/sounds/boardFill.mp3",
            "/sounds/dailyDouble.mp3",
            "/sounds/finalJeffpardyReveal.mp3",
            "/sounds/finalJeopardy.mp3",
        ];
        sounds.forEach((src) => {
            const audio = new Audio(src);
            audio.load();
        });
    }

    componentWillUnmount() {
        window.removeEventListener("keydown", this.handleKeyDown);
    }

    public render() {
        Logger.debug("Lobby:render", this.props.teams);
        const playerUri: string = window.location.origin + "/player#" + this.props.gameCode;

        return (
            <div className="hostStartPage">
                <button className="backButton" onClick={this.props.onBack}>
                    ← Back
                </button>
                <div className="titleContainer">
                    <img src="/images/JeffpardyTitle.png" className="title" alt="Jeffpardy" />
                </div>
                <div className="gameCode jeffpardy-label">Game Code: {this.props.gameCode}</div>
                Give the above game code to the players or give them this direct link:
                <br />
                <a target="#" href={playerUri}>
                    {playerUri}
                </a>
                <p />
                <div style={{ background: "white", padding: "8px", display: "inline-block", borderRadius: "4px" }}>
                    <QRCode.QRCodeCanvas value={playerUri} size={138} includeMargin={false} />
                </div>
                <div className="playerListBox">
                    <div className="boxTitle">Teams &amp; Players</div>
                    <i>When all players have joined, click the &ldquo;Start Game&rdquo; button below.</i>
                    <PlayerList teams={this.props.teams} />
                </div>
                <button onClick={this.props.onStartGame}>Start Game</button>
                <div className="flexGrowSpacer"></div>
                <Attribution />
            </div>
        );
    }
}
