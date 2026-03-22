// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";

export enum ScoreboardEntryBuzzerState {
    Off,
    Active,
    BuzzedIn,
    OffNoControl,
    WrongAnswer,
}

export interface IScoreboardEntryProps {
    teamName: string;
    buzzerState: ScoreboardEntryBuzzerState;
    userName: string;
    isControllingTeam: boolean;
    score: number;
    isWinningTeam: boolean;
}

/** Displays a single team's scoreboard entry, showing buzzer state indicator, team name, and current score. */
export class ScoreboardEntry extends React.Component<IScoreboardEntryProps> {
    constructor(props: IScoreboardEntryProps) {
        super(props);
    }

    public render() {
        let buzzerIndicatorClass = "buzzerIndicator";
        if (this.props.buzzerState == ScoreboardEntryBuzzerState.Active) {
            buzzerIndicatorClass += " buzzerActive";
        } else if (this.props.buzzerState == ScoreboardEntryBuzzerState.BuzzedIn) {
            buzzerIndicatorClass += " buzzedIn";
        } else if (this.props.buzzerState == ScoreboardEntryBuzzerState.WrongAnswer) {
            buzzerIndicatorClass += " wrongAnswer";
        }

        let scoreboardEntryClass = "scoreboardEntry jeffpardy-label";
        if (this.props.buzzerState == ScoreboardEntryBuzzerState.Off && this.props.isControllingTeam) {
            scoreboardEntryClass += " controllingTeam";
        }

        if (this.props.buzzerState == ScoreboardEntryBuzzerState.Off && this.props.isWinningTeam) {
            scoreboardEntryClass += " winningTeam";
        }

        return (
            <div className={scoreboardEntryClass}>
                <div className={buzzerIndicatorClass}>{this.props.userName}</div>
                <div className="teamName">{this.props.teamName} </div>
                <div className="score">{this.props.score}</div>
            </div>
        );
    }
}
