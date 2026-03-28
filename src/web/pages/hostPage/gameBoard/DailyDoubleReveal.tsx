// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { ICategory, IClue } from "../../../Types";

export interface IDailyDoubleRevealProps {
    activeCategory: ICategory;
    activeClue: IClue;
    dailyDoubleMaxBet: number;
    dailyDoubleRevealed: boolean;
    wagerError: string;
    onWagerInputChange: (value: string) => void;
    onSubmitWager: (maxBet: number) => void;
}

/** Displays the Daily Double reveal screen with the category header, wager input, and submit button. */
export class DailyDoubleReveal extends React.Component<IDailyDoubleRevealProps> {
    public render() {
        const { activeCategory, activeClue, dailyDoubleMaxBet, dailyDoubleRevealed, wagerError } = this.props;

        return (
            <div className="jeffpardyActiveClue dailyDoubleView">
                <audio autoPlay>
                    <source src="/sounds/dailyDouble.mp3" type="audio/mp3" />
                </audio>
                <img
                    src="/images/DailyDouble.jpg"
                    className={"dailyDoubleImage" + (dailyDoubleRevealed ? " faded" : "")}
                    alt="Daily Double"
                />
                <div className={"dailyDoubleContent" + (dailyDoubleRevealed ? " visible" : "")}>
                    <div className="header">
                        {activeCategory.title} for {activeClue.value}
                    </div>
                    <div className="dailyDouble">
                        <div>The answer is a....</div>
                        <div className="title">Daily Double!</div>
                        <div className="wager">
                            Wager amount:
                            <br />
                            <div className="wagerInputContainer">
                                <input
                                    type="number"
                                    min={0}
                                    max={dailyDoubleMaxBet}
                                    aria-label="Daily Double wager"
                                    onChange={(e) => {
                                        this.props.onWagerInputChange(e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "-" || e.key === ".") {
                                            e.preventDefault();
                                        } else if (e.key === "Enter") {
                                            this.props.onSubmitWager(dailyDoubleMaxBet);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <div className="wagerHint">Enter a value up to {dailyDoubleMaxBet}.</div>
                        <div className={"wagerError" + (wagerError ? " visible" : "")}>{wagerError || "\u00A0"}</div>
                        <button
                            onClick={() => {
                                this.props.onSubmitWager(dailyDoubleMaxBet);
                            }}
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
