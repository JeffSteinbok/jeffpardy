import * as React from "react";
import { IJeffpardyBoard } from "./JeffpardyBoard";
import { ICategory } from "../Types";

export interface IJeffpardyCategoryState {
}

export interface IJeffpardyCategoryProps {
    style: React.CSSProperties;
    jeffpardyBoard: IJeffpardyBoard;
    category: ICategory
}


export class JeffpardyCategory extends React.Component<IJeffpardyCategoryProps, IJeffpardyCategoryState> {

    private contextMenuTarget: any;

    constructor(props: IJeffpardyCategoryProps) {
        super(props);
    }

    public render() {
        return (
            <div className="jeffpardyCategory" style={ this.props.style }>
                { !this.props.category.isAsked &&
                    this.props.category.title }
            </div>
        );
    }
}
