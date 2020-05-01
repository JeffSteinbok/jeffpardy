import * as React from "react";
import { IPlayer, TeamDictionary } from "../../../Types";
import { Logger } from "../../../utilities/Logger";
import { FinalJeffpardySubmissionDictionary } from "../Types";

export interface IFinalJeffpardySubmissionListProps {
    teams: TeamDictionary,
    submissions: FinalJeffpardySubmissionDictionary,
    waitingText: string;
    receivedText: string;
}

export class FinalJeffpardySubmissionList extends React.Component<IFinalJeffpardySubmissionListProps, any> {

    constructor(props: any) {
        super(props);

        Logger.debug("FinalJeffpardySubmissionList:constructor", this.props.teams);
    }

    public render() {
        Logger.debug("FinalJeffpardySubmissionList:render", this.props.teams);

        return (
            <ul className="finalJeffpardySubmissionList">
                {
                    Object.keys(this.props.teams).sort().map((teamName, index) => {
                        return (
                            <li key={ index }>Team: { teamName }
                                <table>
                                    <tbody>
                                        {
                                            this.props.teams[teamName].players.map((player, index) => {

                                                // Do we have a value for this user?
                                                let haveValue: boolean = false;
                                                if (player.connectionId in this.props.submissions) { haveValue = true; }

                                                return (
                                                    <tr key={ index }>
                                                        <td>{ player.name }</td>
                                                        <td>{ haveValue ? this.props.receivedText : this.props.waitingText }</td>
                                                    </tr>
                                                )
                                            })
                                        }
                                    </tbody>
                                </table>
                            </li>
                        )
                    })
                }
            </ul>
        );
    }
}
