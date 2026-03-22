import * as React from "react";
import { ICategory } from "../../../Types";

export interface ICategoryRevealProps {
    categories: ICategory[];
    round: number;
    revealCategoryIndex: number;
    revealShowingName: boolean;
    boardFillRevealed: Set<number>;
    roundLogoSrc: string;
}

export class CategoryReveal extends React.Component<ICategoryRevealProps> {
    public render() {
        const { categories, round, revealCategoryIndex, revealShowingName, boardFillRevealed, roundLogoSrc } =
            this.props;

        if (!categories) return null;

        // Placeholder board (before filmstrip starts)
        if (revealCategoryIndex === -1) {
            return (
                <div className="jeffpardyBoardClues categoryRevealBoard">
                    {categories.map((cat, i) => (
                        <div
                            key={i}
                            className="jeffpardyCategory categoryPlaceholder"
                            style={{ gridRow: 1, gridColumn: i + 1 }}
                        >
                            <img src={roundLogoSrc} className="categoryPlaceholderLogo" />
                        </div>
                    ))}
                    {categories.map((cat, i) =>
                        cat.clues.map((clue, j) => {
                            const cellIndex = i * cat.clues.length + j;
                            const isRevealed = round > 0 || boardFillRevealed.has(cellIndex);
                            return (
                                <div
                                    key={`${i}-${j}`}
                                    className="jeffpardyClue categoryPlaceholderClue"
                                    style={{ gridRow: j + 2, gridColumn: i + 1 }}
                                >
                                    {isRevealed && <span className="placeholderValue">{clue.value}</span>}
                                </div>
                            );
                        })
                    )}
                    <div className="categoryRevealHint">press SPACE to continue</div>
                </div>
            );
        }

        // Filmstrip reveal
        return (
            <div className="categoryRevealFilmstrip">
                <div
                    className="categoryRevealTrack"
                    style={{ transform: `translateX(-${revealCategoryIndex * 100}%)` }}
                >
                    {categories.map((cat, i) => {
                        const airDate = new Date(cat.airDate);
                        const dateStr = airDate.getMonth() + 1 + "/" + airDate.getDate() + "/" + airDate.getFullYear();
                        const isActive = i === revealCategoryIndex;
                        const showName = isActive && revealShowingName;
                        return (
                            <div key={i} className={"categoryRevealSlide" + (showName ? " revealed" : "")}>
                                <div className="categoryRevealDarkOverlay"></div>
                                <div className="categoryRevealTitleContainer">
                                    <div
                                        className={
                                            "categoryRevealTitle categoryRevealPlaceholderText" +
                                            (showName ? " hidden" : "")
                                        }
                                    >
                                        <img src={roundLogoSrc} className="categoryRevealLogo" />
                                    </div>
                                    <div
                                        className={
                                            "categoryRevealTitle categoryRevealNameText" + (showName ? " visible" : "")
                                        }
                                    >
                                        {cat.title}
                                    </div>
                                </div>
                                <div className={"categoryRevealDate" + (showName ? " visible" : "")}>{dateStr}</div>
                            </div>
                        );
                    })}
                </div>
                <div className="categoryRevealHint">press SPACE to continue</div>
            </div>
        );
    }
}
