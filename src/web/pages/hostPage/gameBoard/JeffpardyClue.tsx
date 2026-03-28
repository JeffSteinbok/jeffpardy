// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { IJeffpardyBoard } from "./JeffpardyBoard";
import { ICategory, IClue } from "../../../Types";

export interface IJeffpardyClueProps {
    style: React.CSSProperties;
    jeffpardyBoard: IJeffpardyBoard;
    category: ICategory;
    clue: IClue;
}

/** Renders a single clue cell on the game board; clicking it marks the clue as asked and triggers the clue display. */
export class JeffpardyClue extends React.Component<IJeffpardyClueProps> {
    private clickClue(event) {
        this.props.jeffpardyBoard.showClue(this.props.category, this.props.clue);
        this.props.clue.isAsked = true;

        let isCategoryAsked: boolean = true;
        this.props.category.clues.forEach((clue: IClue) => {
            if (!clue.isAsked) {
                isCategoryAsked = false;
            }
        });
        this.props.category.isAsked = isCategoryAsked;

        event.preventDefault();
    }

    public render() {
        return (
            <div className="jeffpardyClue jeffpardy-label" style={this.props.style}>
                {!this.props.clue.isAsked && (
                    <a
                        href="#"
                        onClick={(e) => {
                            this.clickClue(e);
                        }}
                    >
                        {this.props.clue.value}
                    </a>
                )}
            </div>
        );
    }
}
