import * as React from "react";

export enum ScoreboardEntryBuzzerState {
    Off,
    Active,
    BuzzedIn
}

export interface IScoreboardEntryProps {
    teamName: string;
    buzzerState: ScoreboardEntryBuzzerState;
}

/**
 * Top bar containing toolbar buttons and drop downs
 */
export class ScoreboardEntry extends React.Component<IScoreboardEntryProps, any> {

    constructor(props: any) {
        super(props);
    }

    public render() {
        let buzzerIndicatorClass = 'buzzerIndicator'
        if (this.props.buzzerState == ScoreboardEntryBuzzerState.Active) {
            buzzerIndicatorClass += ' buzzerActive'
        } else if (this.props.buzzerState == ScoreboardEntryBuzzerState.BuzzedIn) {
            buzzerIndicatorClass += ' buzzedIn'
        }

        return (
            <div className="scoreboardEntry">
                <div className={ buzzerIndicatorClass }></div>
                <div className="teamName">{ this.props.teamName } </div>
                <div className="score">20000</div>
            </div>
        );
    }
}
