import * as React from "react";
import { IJeffpardyBoard } from "./JeffpardyBoard";
import { ICategory } from "../../../Types";

export interface IJeffpardyCategoryProps {
    style: React.CSSProperties;
    jeffpardyBoard: IJeffpardyBoard;
    category: ICategory;
}

export class JeffpardyCategory extends React.Component<IJeffpardyCategoryProps> {
    private contextMenuTarget: HTMLElement;

    constructor(props: IJeffpardyCategoryProps) {
        super(props);
    }

    public render() {
        return (
            <div className="jeffpardyCategory jeffpardy-label" style={this.props.style}>
                {!this.props.category.isAsked && this.props.category.title}
            </div>
        );
    }
}
