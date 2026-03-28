// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { IJeffpardyBoard } from "./JeffpardyBoard";
import { ICategory } from "../../../Types";

export interface IJeffpardyCategoryProps {
    style: React.CSSProperties;
    jeffpardyBoard: IJeffpardyBoard;
    category: ICategory;
}

/** Renders a single category header cell on the game board, showing the title if the category has not yet been fully asked. */
export class JeffpardyCategory extends React.Component<IJeffpardyCategoryProps> {
    public render() {
        return (
            <div className="jeffpardyCategory jeffpardy-label" style={this.props.style}>
                {!this.props.category.isAsked && this.props.category.title}
            </div>
        );
    }
}
