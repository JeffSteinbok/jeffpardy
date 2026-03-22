// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { TeamDictionary } from "../../Types";
import { Logger } from "../../utilities/Logger";

export interface IPlayerListProps {
    teams: TeamDictionary;
    scores?: { [key: string]: number };
    lockedInPlayerIds?: string[];
}
/** Displays a list of teams and their players, optionally showing scores and locked-in indicators. */
export class PlayerList extends React.Component<IPlayerListProps> {
    constructor(props: IPlayerListProps) {
        super(props);

        Logger.debug("PlayerList:constructor", this.props.teams);
    }

    public render() {
        Logger.debug("PlayerList:render", this.props.teams);
        const lockedIn = new Set(this.props.lockedInPlayerIds || []);

        return (
            <ul className="playerList">
                {Object.keys(this.props.teams)
                    .sort()
                    .map((teamName, index) => {
                        return (
                            <li key={index}>
                                Team: {teamName}
                                {this.props.scores && this.props.scores[teamName] !== undefined && (
                                    <span className="teamScore"> — {this.props.scores[teamName]}</span>
                                )}
                                <ul>
                                    {this.props.teams[teamName].players.map((player, index) => {
                                        const isLockedIn = lockedIn.has(player.connectionId);
                                        return (
                                            <li
                                                style={{ display: "block" }}
                                                key={index}
                                                className={isLockedIn ? "lockedIn" : ""}
                                            >
                                                {player.name}{" "}
                                                {isLockedIn && <span className="lockedInIndicator">🔒</span>}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </li>
                        );
                    })}
            </ul>
        );
    }
}
