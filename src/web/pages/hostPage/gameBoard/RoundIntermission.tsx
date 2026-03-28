// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";

export interface IRoundIntermissionProps {
    round: number;
    totalNonFinalRounds: number;
    onStartNewRound: () => void;
}

/** Displays the intermission screen between rounds, prompting the host to start the next round or Final Jeffpardy. */
export class RoundIntermission extends React.Component<IRoundIntermissionProps> {
    public render() {
        const { round, totalNonFinalRounds, onStartNewRound } = this.props;

        return (
            <div className="jeffpardyIntermission">
                {round < totalNonFinalRounds - 1 && (
                    <>
                        Get ready for... <br />
                        <div className="title">Super</div>
                        <img src="/images/JeffpardyTitle.png" className="intermissionTitle" alt="Jeffpardy" />
                        <p />
                        <button onClick={onStartNewRound}>Start</button>
                    </>
                )}
                {round >= totalNonFinalRounds - 1 && (
                    <>
                        <img src="/images/FinalJeffpardy.png" className="intermissionLogo" alt="Final Jeffpardy" />
                        <div className="categoryRevealHint">PRESS SPACE TO CONTINUE</div>
                    </>
                )}
            </div>
        );
    }
}
