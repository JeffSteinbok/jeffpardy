import * as React from "react";
import { IClue, ICategory } from "../../JeffpardyController";
import { Logger } from "../../utilities/Logger";
import { IJeffpardyBoard } from "./JeffpardyBoard";

export interface IJeffpardyClueState {
    isAsked: boolean;
}

export interface IJeffpardyClueProps {
    jeopardyBoard: IJeffpardyBoard;
    category: ICategory;
    clue: IClue;
}

export class JeffpardyClue extends React.Component<IJeffpardyClueProps, IJeffpardyClueState> {

    private contextMenuTarget: any;

    constructor(props: IJeffpardyClueProps) {
        Logger.debug("ClueConst");
        super(props);

        this.state = {
            isAsked: false
        }
    }

    private clickClue(event) {
        this.props.jeopardyBoard.showClue(this.props.category, this.props.clue);
        this.props.clue.isAsked = true;

        let isCategoryAsked: boolean = true;
        this.props.category.questions.forEach((clue: IClue) => {
            if (!clue.isAsked) {
                isCategoryAsked = false;
            }
        })
        this.props.category.isAsked = isCategoryAsked;

        event.preventDefault();
    }

    public render() {
        return (
            <div>
                { !this.props.clue.isAsked &&
                    <a href="#" onClick={ (e) => { this.clickClue(e); } }>{ this.props.clue.value }</a>
                }
            </div >
        );
    }
}
