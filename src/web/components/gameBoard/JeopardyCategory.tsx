import * as React from "react";
import { ICategory } from "../../JeopardyController";
import { Logger } from "../../utilities/Logger";
import { IJeopardyBoard } from "./JeopardyBoard";

export interface IJeopardyCategoryState {
}

export interface IJeopardyCategoryProps {
    jeopardyBoard: IJeopardyBoard;
    category: ICategory
}


export class JeopardyCategory extends React.Component<IJeopardyCategoryProps, IJeopardyCategoryState> {

    private contextMenuTarget: any;

    constructor(props: IJeopardyCategoryProps) {
        super(props);
    }

    public render() {
        return (
            <div>
                { !this.props.category.isAsked &&
                    this.props.category.title }
            </div>
        );
    }
}
