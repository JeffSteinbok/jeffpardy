// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { Timer } from "./Timer";
import { ICategory, IClue } from "../../../Types";
import { sanitizeHtml } from "../../../utilities/sanitize";

export interface IClueDisplayProps {
    activeCategory: ICategory;
    activeClue: IClue;
    showQuestion: boolean;
    timerPercentageRemaining: number;
}

/** Displays the active clue during gameplay, showing the category header, clue text, answer, and countdown timer. */
export class ClueDisplay extends React.Component<IClueDisplayProps> {
    public render() {
        const { activeCategory, activeClue, showQuestion, timerPercentageRemaining } = this.props;

        return (
            <div className="jeffpardyActiveClue">
                <div className="header">
                    {activeCategory.title} for {activeClue.value}
                </div>
                <div
                    className="clue"
                    dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(activeClue.clue),
                    }}
                ></div>
                <div
                    className="question"
                    dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(showQuestion ? activeClue.question : "\u00A0"),
                    }}
                ></div>
                <Timer percentageRemaining={timerPercentageRemaining}></Timer>
            </div>
        );
    }
}
