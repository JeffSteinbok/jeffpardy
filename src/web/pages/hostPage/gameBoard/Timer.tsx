import * as React from "react";

export interface ITimerProps {
    percentageRemaining: number;
}

export class Timer extends React.Component<ITimerProps> {

    private contextMenuTarget: any;

    constructor(props: ITimerProps) {
        super(props);
    }

    public render() {
        let timerElements: JSX.Element[] = [];

        for (var i = 0; i < 400; i++) {
            timerElements.push(<div key={ i } className={ i < ((1 - this.props.percentageRemaining) * 400) ? "lit" : "" }></div>);
        }

        return (
            <div className="timer">
                { timerElements }
            </div >
        );
    }
}
