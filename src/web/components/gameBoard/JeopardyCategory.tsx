import * as React from "react";
import { JeopardyClue } from "./JeopardyClue"
import { ICategory } from "./ICategory";
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
            <div className="jeopardyCategory">
                <div className="categoryName">
                    { this.props.category.title }
                </div>
                <div className="clues">
                    { this.props.category.questions.map((value, index) => {
                        return <JeopardyClue
                            jeopardyBoard={ this.props.jeopardyBoard }
                            key={ index }
                            value={ (index + 1) * 100 }
                            question={ value } />
                    }) }
                </div>
            </div>
        );
    }
}
