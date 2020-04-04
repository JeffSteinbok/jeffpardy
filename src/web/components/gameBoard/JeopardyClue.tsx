import * as React from "react";
import { IQuestion, ICategory } from "./ICategory";
import { Logger } from "../../utilities/Logger";
import { IJeopardyBoard } from "./JeopardyBoard";

export interface IJeopardyClueState {
}

export interface IJeopardyClueProps {
    jeopardyBoard: IJeopardyBoard;
    category: ICategory;
    value: number;
    question: IQuestion;
}

export class JeopardyClue extends React.Component<IJeopardyClueProps, IJeopardyClueState> {

    private contextMenuTarget: any;

    constructor(props: IJeopardyClueProps) {
        super(props);
    }

    private clickClue() {
        this.props.jeopardyBoard.showClue(this.props.category, this.props.value, this.props.question)
    }

    public render() {
        return (
            <div className="clue">
                <a href="#" onClick={ () => this.clickClue() }>{ this.props.value }</a>
            </div>
        );
    }
}
