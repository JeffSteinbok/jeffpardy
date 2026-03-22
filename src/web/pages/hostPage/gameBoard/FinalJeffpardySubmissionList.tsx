import * as React from "react";
import { TeamDictionary } from "../../../Types";
import { Logger } from "../../../utilities/Logger";
import { FinalJeffpardySubmissionDictionary } from "../Types";

export interface IFinalJeffpardySubmissionListProps {
    teams: TeamDictionary;
    submissions: FinalJeffpardySubmissionDictionary;
    waitingText: string;
    receivedText: string;
}

export class FinalJeffpardySubmissionList extends React.Component<IFinalJeffpardySubmissionListProps> {
    constructor(props: IFinalJeffpardySubmissionListProps) {
        super(props);

        Logger.debug("FinalJeffpardySubmissionList:constructor", this.props.teams);
    }

    public render() {
        Logger.debug("FinalJeffpardySubmissionList:render", this.props.teams);

        return (
            <ul className="finalJeffpardySubmissionList">
                {Object.keys(this.props.teams)
                    .sort()
                    .map((teamName, index) => {
                        const allSubmitted = this.props.teams[teamName].players.every(
                            (player) => player.connectionId in this.props.submissions
                        );
                        return (
                            <li key={index} className={allSubmitted ? "submitted" : ""}>
                                <div className="fjTeamName jeffpardy-label">{teamName}</div>
                                {this.props.teams[teamName].players.map((player, pIndex) => {
                                    const hasValue = player.connectionId in this.props.submissions;
                                    return (
                                        <div key={pIndex} className={"fjPlayer" + (hasValue ? " received" : "")}>
                                            <span className="fjPlayerName">{player.name}</span>
                                            <span className="fjPlayerStatus">
                                                {hasValue ? this.props.receivedText : this.props.waitingText}
                                            </span>
                                        </div>
                                    );
                                })}
                            </li>
                        );
                    })}
            </ul>
        );
    }
}
