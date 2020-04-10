import * as React from "react";
import { ICategory, JeffpardyHostController } from "../../JeffpardyHostController";
import { SpecialKey } from "../../utilities/Key";
import { HostPageViewMode } from "../../HostPage";

export interface IHostCheatSheetProps {
    jeffpardyController: JeffpardyHostController;
    categories: ICategory[];
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
                this.props.jeffpardyController.setViewMode(HostPageViewMode.Normal);
                break;
        }
    }


    public render() {
        return (
            <div>
                <i>Print or save this and press ESC to return to the game.</i>
                <ul>
                    {
                        this.props.categories.map((category, index) => {
                            return (
                                <li key={ index }>{ category.title }
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
        );
    }
}
