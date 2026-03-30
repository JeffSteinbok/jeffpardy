// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { TeamDictionary, ITeam } from "../../../Types";

export interface IEndGameProps {
    teams: TeamDictionary;
}

/** End-of-game screen showing the winner and final scores. */
export class EndGame extends React.Component<IEndGameProps> {
    public render() {
        const teamList: ITeam[] = Object.values(this.props.teams);
        teamList.sort((a, b) => b.score - a.score);

        const highScore = teamList.length > 0 ? teamList[0].score : 0;

        return (
            <div className="jeffpardyEndGame">
                <img src="/images/EndGame.png" className="endGameImage" alt="Thank you for playing Jeffpardy!" />
                <div className="endGameHint">Reload to start a new game</div>
            </div>
        );
    }
}
