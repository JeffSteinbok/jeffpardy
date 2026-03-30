// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";

export interface ITimerProps {
    percentageRemaining: number;
}

/** Visual countdown timer bar that fills from left to right as time elapses. */
export class Timer extends React.Component<ITimerProps> {
    constructor(props: ITimerProps) {
        super(props);
    }

    public render() {
        const elapsedPercent = Math.max(0, Math.min(100, (1 - this.props.percentageRemaining) * 100));
        const isReset = this.props.percentageRemaining === 1;

        return (
            <div className="timer">
                <div
                    className={`timerFill${isReset ? " noTransition" : ""}`}
                    style={{ width: `${elapsedPercent}%` }}
                />
            </div>
        );
    }
}
