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

/** Displays a list of teams and their players, optionally showing scores and locked-in indicators.
 *  When scores are provided, renders as a score-sorted table with FLIP position animations. */
export class PlayerList extends React.Component<IPlayerListProps> {
    private rowRefs: Map<string, HTMLTableRowElement> = new Map();
    private prevPositions: Map<string, number> = new Map();

    constructor(props: IPlayerListProps) {
        super(props);
        Logger.debug("PlayerList:constructor", this.props.teams);
    }

    getSnapshotBeforeUpdate(): Map<string, number> | null {
        if (!this.props.scores) return null;
        const positions = new Map<string, number>();
        this.rowRefs.forEach((el, teamName) => {
            if (el) positions.set(teamName, el.getBoundingClientRect().top);
        });
        return positions;
    }

    componentDidUpdate(_prevProps: IPlayerListProps, _prevState: unknown, snapshot: Map<string, number> | null) {
        if (!snapshot) return;
        this.rowRefs.forEach((el, teamName) => {
            if (!el) return;
            const oldTop = snapshot.get(teamName);
            if (oldTop === undefined) return;
            const newTop = el.getBoundingClientRect().top;
            const delta = oldTop - newTop;
            if (delta === 0) return;
            el.style.transition = "none";
            el.style.transform = `translateY(${delta}px)`;
            // Force reflow then animate to final position
            void el.offsetHeight;
            el.style.transition = "transform 0.4s ease";
            el.style.transform = "";
        });
    }

    private getSortedTeamNames(): string[] {
        const teamNames = Object.keys(this.props.teams);
        if (this.props.scores) {
            return teamNames.sort((a, b) => (this.props.scores[b] ?? 0) - (this.props.scores[a] ?? 0));
        }
        return teamNames.sort();
    }

    private renderScoreTable() {
        const teamNames = this.getSortedTeamNames();

        return (
            <table className="playerScoreTable">
                <thead>
                    <tr>
                        <th className="teamNameCol">Team</th>
                        <th className="scoreCol">Score</th>
                    </tr>
                </thead>
                <tbody>
                    {teamNames.map((teamName) => {
                        const score = this.props.scores[teamName] ?? 0;
                        return (
                            <tr
                                key={teamName}
                                ref={(el) => {
                                    if (el) this.rowRefs.set(teamName, el);
                                }}
                            >
                                <td className="teamNameCol">{teamName}</td>
                                <td className={"scoreCol" + (score < 0 ? " negative" : "")}>{score}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    }

    private renderLobbyList() {
        const lockedIn = new Set(this.props.lockedInPlayerIds || []);
        const teamNames = this.getSortedTeamNames();

        return (
            <ul className="playerList">
                {teamNames.map((teamName, index) => (
                    <li key={index}>
                        Team: {teamName}
                        <ul>
                            {this.props.teams[teamName].players.map((player, i) => {
                                const isLockedIn = lockedIn.has(player.connectionId);
                                return (
                                    <li style={{ display: "block" }} key={i} className={isLockedIn ? "lockedIn" : ""}>
                                        {player.name} {isLockedIn && <span className="lockedInIndicator">🔒</span>}
                                    </li>
                                );
                            })}
                        </ul>
                    </li>
                ))}
            </ul>
        );
    }

    public render() {
        Logger.debug("PlayerList:render", this.props.teams);

        if (this.props.scores) {
            return this.renderScoreTable();
        }
        return this.renderLobbyList();
    }
}
