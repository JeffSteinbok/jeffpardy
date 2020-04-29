import * as React from "react";
import { SpecialKey } from "../../../utilities/Key";
import { HostPageViewMode } from "../HostPage";
import { Logger } from "../../../utilities/Logger";
import { IGameRound, ICategory, IClue, IGameData } from "../Types";

export interface IAnswerKeyProps {
    gameData: IGameData;
    onHide: () => void;
}

export class AnswerKey extends React.Component<IAnswerKeyProps, any> {

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
                this.props.onHide();
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
                    <div className="answerKeyCategory" key={ keyCounter++ } style={ { gridRow: 1, gridColumn: i + 1 } }>
                        <div className="title">{ category.title }</div>
                        <div>{ category.comment }</div>
                        <div>{ airDate.getMonth() + 1 + "/" + airDate.getDay() + "/" + airDate.getFullYear() }</div>
                    </div>);

                for (var j: number = 0; j < category.clues.length; j++) {
                    let clue: IClue = category.clues[j];
                    boardGridElements.push(
                        <div className="answerKeyClue" key={ keyCounter++ } style={ { gridRow: j + 2, gridColumn: i + 1 } }>
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
        Logger.debug("AnswerKey:render", this.props.gameData);

        let finalCategory: ICategory;
        let finalAirDate: Date;

        if (this.props.gameData != null) {
            finalCategory = this.props.gameData.finalJeffpardyCategory;
            finalAirDate = new Date(finalCategory.airDate);
        }

        return (
            <div>
                <i className="noPrint">Print or save this and press ESC to return to the game.</i>
                {
                    this.props.gameData.rounds.map((round, index) => {
                        return (
                            <div className={ "answerKeyRound" + (round.id == 0 ? " pageBreakAfter" : "") } key={ index }>
                                <h1>{ round.name }</h1>
                                <div className="answerKeyClues">
                                    { this.getRoundGrid(round)
                                    }
                                </div>
                            </div>
                        )
                    })
                }
                <h1>Final Jeffpardy</h1>
                <div className="title">{ finalCategory.title }</div>
                <div>{ finalCategory.comment }</div>
                <div>{ finalAirDate.getMonth() + 1 + "/" + finalAirDate.getDay() + "/" + finalAirDate.getFullYear() }</div>
                <div className="clue">{ finalCategory.clues[0].clue }</div>
                <div className="question">{ finalCategory.clues[0].question }</div>
            </div>
        );
    }
}

