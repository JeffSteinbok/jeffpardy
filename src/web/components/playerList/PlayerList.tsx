import * as React from "react";
import { IPlayer } from "../../../interfaces/IPlayer";

export interface IPlayerListProps {
    teams: { [key: string]: IPlayer[] }
}
/**
 * Top bar containing toolbar buttons and drop downs
 */
export class PlayerList extends React.Component<IPlayerListProps, any> {

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
