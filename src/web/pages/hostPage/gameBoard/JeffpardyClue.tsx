import * as React from "react";
import { Logger } from "../../../utilities/Logger";
import { IJeffpardyBoard } from "./JeffpardyBoard";
import { ICategory, IClue } from "../../../Types";

export interface IJeffpardyClueState {
    isAsked: boolean;
}

export interface IJeffpardyClueProps {
    style: React.CSSProperties;
    jeffpardyBoard: IJeffpardyBoard;
    category: ICategory;
    clue: IClue;
}

export class JeffpardyClue extends React.Component<IJeffpardyClueProps, IJeffpardyClueState> {

    private contextMenuTarget: any;

    constructor(props: IJeffpardyClueProps) {
        super(props);

        this.state = {
            isAsked: false
        }
    }

    private clickClue(event) {
        this.props.jeffpardyBoard.showClue(this.props.category, this.props.clue);
        this.props.clue.isAsked = true;

        let isCategoryAsked: boolean = true;
        this.props.category.clues.forEach((clue: IClue) => {
            if (!clue.isAsked) {
                isCategoryAsked = false;
            }
        })
        this.props.category.isAsked = isCategoryAsked;

        event.preventDefault();
    }

    public render() {
        return (
            <div className="jeffpardyClue" style={ this.props.style }>
                { !this.props.clue.isAsked &&
                    <a href="#" onClick={ (e) => { this.clickClue(e); } }>{ this.props.clue.value }</a>
                }
            </div >
        );
    }
}
