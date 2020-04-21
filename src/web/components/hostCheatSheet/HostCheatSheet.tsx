import * as React from "react";
import { ICategory, JeffpardyHostController, IGameData, IGameRound, IClue } from "../../JeffpardyHostController";
import { SpecialKey } from "../../utilities/Key";
import { HostPageViewMode } from "../../HostPage";
import { Logger } from "../../utilities/Logger";

export interface IHostCheatSheetProps {
    jeffpardyController: JeffpardyHostController;
    gameData: IGameData;
}

export class HostCheatSheet extends React.Component<IHostCheatSheetProps, any> {

    constructor(props: any) {
        super(props);
    }

    componentDidMount = () => {
        window.addEventListener("keydown", this.handleKeyDown)
    }

    componentWillUnmount() {
        window.removeEventListener("keydown", this.handleKeyDown);
    }


    handleKeyDown = (event: KeyboardEvent) => {
        switch (event.keyCode) {
            case SpecialKey.ESCAPE:
                this.props.jeffpardyController.setViewMode(HostPageViewMode.Start);
                break;
        }
    }

    public getRoundGrid = (round: IGameRound): JSX.Element[] => {
        let boardGridElements: JSX.Element[] = [];

        if (round.categories) {

            // Generate the grid of DIVs.  Doesn't work super-well in the below because they are not
            // nested.
            var keyCounter: number = 0;
            for (var i: number = 0; i < round.categories.length; i++) {
                let category: ICategory = round.categories[i];
                let airDate: Date = new Date(category.airDate);
                boardGridElements.push(
                    <div className="hostCheatSheetCategory" key={ keyCounter++ } style={ { gridRow: 1, gridColumn: i + 1 } }>
                        <div className="title">{ category.title }</div>
                        <div>{ category.comment }</div>
                        <div>{ airDate.getMonth() + 1 + "/" + airDate.getDay() + "/" + airDate.getFullYear() }</div>
                    </div>);

                for (var j: number = 0; j < category.clues.length; j++) {
                    let clue: IClue = category.clues[j];
                    boardGridElements.push(
                        <div className="hostCheatSheetClue" key={ keyCounter++ } style={ { gridRow: j + 2, gridColumn: i + 1 } }>
                            <div className="value">{ clue.value }{ clue.isDailyDouble ? " - DD" : "" }</div>
                            <div className="clue">{ clue.clue }</div>
                            <div className="question">{ clue.question }</div>
                        </div>
                    );
                }
            }
        }

        return boardGridElements;
    }


    public render() {
        Logger.debug("HostCheatSheet:render", this.props.gameData);

        return (
            <div>
                <i>Print or save this and press ESC to return to the game.</i>
                {
                    this.props.gameData.rounds.map((round, index) => {
                        return (
                            <div className="hostCheatSheetRound" key={ index }>
                                <h1>Round { round.id + 1 }</h1>
                                <div className="hostCheatSheetClues">
                                    { this.getRoundGrid(round)
                                    }
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        );
    }
}
