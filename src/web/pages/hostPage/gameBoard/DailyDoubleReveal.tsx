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
                                    onChange={(e) => {
                                        this.props.onWagerInputChange(e.target.value);
                                    }}
                                />
                                {wagerError && <div className="wagerError">{wagerError}</div>}
                            </div>
                        </div>
                        <div className="wagerHint">Enter a value up to {dailyDoubleMaxBet}.</div>
                        <p />
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
