import * as React from "react";
import { IPlayer, TeamDictionary } from "../../Types";
import { Logger } from "../../utilities/Logger";

export interface IPlayerListProps {
    teams: TeamDictionary
}
/**
 * Top bar containing toolbar buttons and drop downs
 */
export class PlayerList extends React.Component<IPlayerListProps, any> {

    constructor(props: any) {
        super(props);

        Logger.debug("PlayerList:constructor", this.props.teams);
    }

    public render() {
        Logger.debug("PlayerList:render", this.props.teams);

        return (
            <ul className="playerList">
                {
                    Object.keys(this.props.teams).sort().map((teamName, index) => {
                        return (
                            <li key={ index }>Team: { teamName }
                                <ul>
                                    {
                                        this.props.teams[teamName].players.map((player, index) => {
                                            return (
                                                <li style={ { display: 'block' } } key={ index }> { player.name } </li>
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
