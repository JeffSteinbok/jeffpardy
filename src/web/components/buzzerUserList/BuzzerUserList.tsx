import * as React from "react";
import { IBuzzerUser } from "../../Buzzer";

export interface IBuzzerUserListProps {
    teams: { [key: string]: IBuzzerUser[] }
}
/**
 * Top bar containing toolbar buttons and drop downs
 */
export class BuzzerUserList extends React.Component<IBuzzerUserListProps, any> {

    constructor(props: any) {
        super(props);
    }

    public render() {
        return (
            <ul>
                {
                    Object.keys(this.props.teams).sort().map((teamName, index) => {
                        return (
                            <li key={ index }>{ teamName }
                                <ul>
                                    {
                                        this.props.teams[teamName].map((user, index) => {
                                            return (
                                                <li style={ { display: 'block' } } key={ index }> { user.name } </li>
                                            )
                                        })
                                    }
                                </ul>
                            </li>
                        )
                    })
                }
            </ul>
        );
    }
}
