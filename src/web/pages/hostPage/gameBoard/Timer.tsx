import * as React from "react";

export interface ITimerProps {
    percentageRemaining: number;
}

export class Timer extends React.Component<ITimerProps> {

    constructor(props: ITimerProps) {
        super(props);
    }

    public render() {
        const elapsedPercent = Math.max(0, Math.min(100, (1 - this.props.percentageRemaining) * 100));

        return (
            <div className="timer">
                <div className="timerFill" style={ { width: `${elapsedPercent}%` } } />
            </div>
        );
    }
}
