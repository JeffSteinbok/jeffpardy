import * as React from "react";
import { ICategory, JeffpardyHostController, IGameData } from "../../JeffpardyHostController";
import { SpecialKey } from "../../utilities/Key";
import { HostPageViewMode } from "../../HostPage";
import { Logger } from "../../utilities/Logger";

export interface IHostCheatSheetProps {
    jeffpardyController: JeffpardyHostController;
    gameData: IGameData;
}

export class HostCheatSheet extends React.Component<IHostCheatSheetProps, any> {

    constructor(props: any) {
        super(props);
    }

    componentDidMount = () => {
        window.addEventListener("keydown", this.handleKeyDown)
    }

    componentWillUnmount() {
        window.removeEventListener("keydown", this.handleKeyDown);
    }


    handleKeyDown = (event: KeyboardEvent) => {
        switch (event.keyCode) {
            case SpecialKey.ESCAPE:
                this.props.jeffpardyController.setViewMode(HostPageViewMode.Start);
                break;
        }
    }


    public render() {
        Logger.debug("HostCheatSheet:render", this.props.gameData);
        return (
            <div>
                <i>Print or save this and press ESC to return to the game.</i>
                {
                    this.props.gameData.rounds.map((round, index) => {
                        return (
                            <div key={ index }>
                                <h1>Round { round.id + 1 }</h1>
                                <ul>
                                    {
                                        round.categories.map((category, index) => {

                                            return (
                                                <li key={ index }>{ category.title }<br />
                                                    <i>{ category.comment }</i>
                                                    <ul>
                                                        {
                                                            category.clues.map((clue, index) => {
                                                                return (
                                                                    <li key={ index }>
                                                                        { clue.value } - { clue.question }
                                                                    </li>
                                                                )
                                                            })
                                                        }
                                                    </ul>
                                                </li>
                                            )

                                        })
                                    }
                                </ul>
                            </div>
                        )
                    })
                }
            </div>
        );
    }
}
