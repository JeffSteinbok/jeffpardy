import * as React from "react";
import { IClue, ICategory } from "../../JeopardyController";
import { Logger } from "../../utilities/Logger";
import { IJeopardyBoard } from "./JeopardyBoard";

export interface IJeopardyClueState {
    isAsked: boolean;
}

export interface IJeopardyClueProps {
    jeopardyBoard: IJeopardyBoard;
    category: ICategory;
    clue: IClue;
}

export class JeopardyClue extends React.Component<IJeopardyClueProps, IJeopardyClueState> {

    private contextMenuTarget: any;

    constructor(props: IJeopardyClueProps) {
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
