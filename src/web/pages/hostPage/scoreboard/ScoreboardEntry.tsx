import * as React from "react";

export enum ScoreboardEntryBuzzerState {
    Off,
    Active,
    BuzzedIn
}

export interface IScoreboardEntryProps {
    teamName: string;
    buzzerState: ScoreboardEntryBuzzerState;
    userName: string;
    isControllingTeam: boolean;
    score: number;
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

        let scoreboardEntryClass = 'scoreboardEntry';
        if (this.props.isControllingTeam) {
            scoreboardEntryClass += ' controllingTeam'
        }

        return (
            <div className={ scoreboardEntryClass }>
                <div className={ buzzerIndicatorClass }>{ this.props.userName }</div>
                <div className="teamName">{ this.props.teamName } </div>
                <div className="score">{ this.props.score }</div>
            </div>
        );
    }
}
