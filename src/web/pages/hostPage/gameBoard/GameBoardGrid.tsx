import * as React from "react";
import { JeffpardyCategory } from "./JeffpardyCategory";
import { JeffpardyClue } from "./JeffpardyClue";
import { IJeffpardyBoard } from "./JeffpardyBoard";
import { ICategory, IClue } from "../../../Types";

export interface IGameBoardGridProps {
    categories: ICategory[];
    jeffpardyBoard: IJeffpardyBoard;
}

export class GameBoardGrid extends React.Component<IGameBoardGridProps> {
    public render() {
        const boardGridElements: React.JSX.Element[] = [];
        let keyCounter: number = 0;

        for (let i: number = 0; i < this.props.categories.length; i++) {
            const category: ICategory = this.props.categories[i];
            boardGridElements.push(
                <JeffpardyCategory
                    key={keyCounter++}
                    style={{ gridRow: 1, gridColumn: i + 1 }}
                    category={category}
                    jeffpardyBoard={this.props.jeffpardyBoard}
                />
            );

            for (let j: number = 0; j < category.clues.length; j++) {
                const clue: IClue = category.clues[j];
                boardGridElements.push(
                    <JeffpardyClue
                        key={keyCounter++}
                        style={{ gridRow: j + 2, gridColumn: i + 1 }}
                        jeffpardyBoard={this.props.jeffpardyBoard}
                        category={category}
                        clue={clue}
                    />
                );
            }
        }

        return <div className="jeffpardyBoardClues">{boardGridElements}</div>;
    }
}
