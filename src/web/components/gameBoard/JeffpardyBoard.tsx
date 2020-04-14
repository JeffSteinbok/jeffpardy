import * as React from "react";
import { JeffpardyCategory } from "./JeffpardyCategory"
import { Logger } from "../../utilities/Logger";
import { JeffpardyHostController, ICategory, IClue } from "../../JeffpardyHostController";
import { JeffpardyClue } from "./JeffpardyClue"
import { Timer } from "./Timer"

export enum JeopardyBoardView {
    Board,
    Clue,
    Question,
    Intermission,
    End
}

export interface IJeffpardyBoardProps {
    jeffpardyHostController: JeffpardyHostController;
    round: number;
    categories: ICategory[];
}

export interface IJeffpardyBoardState {
    activeClue: IClue;
    activeCategory: ICategory;
    jeopardyBoardView: JeopardyBoardView;
    timerPercentageRemaining: number;
}

export interface IJeffpardyBoard {
    showClue: (category: ICategory, clue: IClue) => void;
    showQuestion: () => void;
    showBoard: () => void;
    startTimer: () => void;
    stopTimer: () => void;
}

export class JeffpardyBoard extends React.Component<IJeffpardyBoardProps, IJeffpardyBoardState> implements IJeffpardyBoard {

    private contextMenuTarget: any;
    private categories: ICategory = null;
    private timerHandle;
    private timerRemainingDuration: number;

    constructor(props: any) {
        super(props);

        Logger.debug("JeffpardyBoard:constructor", this.props.categories);

        this.state = {
            jeopardyBoardView: JeopardyBoardView.Board,
            activeClue: null,
            activeCategory: null,
            timerPercentageRemaining: 1
        }

        this.props.jeffpardyHostController.setJeffpardyBoard(this);
    }

    public showClue = (category: ICategory, clue: IClue) => {
        this.setState({
            activeClue: clue,
            activeCategory: category,
            jeopardyBoardView: JeopardyBoardView.Clue
        });
        this.props.jeffpardyHostController.showClue(clue);
    }

    public showQuestion = () => {
        this.stopTimer();

        this.setState({
            jeopardyBoardView: JeopardyBoardView.Question,
        })
    };

    public showBoard = () => {
        this.clearTimer();

        // Are all the clues used?
        let boardEmpty: Boolean = true;
        for (var i = 0; i < this.props.categories.length; i++) {
            if (!this.props.categories[i].isAsked) {
                boardEmpty = false;
            }
        }

        this.setState({
            activeClue: null,
            activeCategory: null,
            jeopardyBoardView: boardEmpty ? (this.props.round == 0 ? JeopardyBoardView.Intermission : JeopardyBoardView.End) : JeopardyBoardView.Board
        })
    };

    public startNewRound = () => {
        this.props.jeffpardyHostController.startNewRound();
        this.setState({
            jeopardyBoardView: JeopardyBoardView.Board
        })
    }

    public startTimer = () => {
        const timerDuration: number = 5;

        this.timerRemainingDuration = timerDuration;
        this.timerHandle = setTimeout(this.onTimerFire, 250);
    }

    public stopTimer = () => {
        clearTimeout(this.timerHandle);
    }

    public clearTimer = () => {
        this.setState({
            timerPercentageRemaining: 1
        })
    }

    public onTimerFire = () => {
        // FIX
        const timerDuration: number = 5;

        this.timerRemainingDuration = this.timerRemainingDuration - 0.25;
        let percentRemaing = (this.timerRemainingDuration) / timerDuration;
        if (percentRemaing != this.state.timerPercentageRemaining) {
            this.setState({
                timerPercentageRemaining: percentRemaing
            })
        }
        if (percentRemaing > 0) {
            this.timerHandle = setTimeout(this.onTimerFire, 250);
        } else {
            // Time's up!
            this.props.jeffpardyHostController.buzzerTimeout();
        }
    }

    public render() {

        Logger.debug("JeffpardyBoard:render", this.props.categories);

        let boardGridElements: JSX.Element[] = [];

        if (this.props.categories && this.state.activeClue == null) {
            Logger.debug("Drawing Categories!", this.props.categories);
            // Generate the grid of DIVs.  Doesn't work super-well in the below because they are not
            // nested.
            var keyCounter: number = 0;
            for (var i: number = 0; i < this.props.categories.length; i++) {
                let category: ICategory = this.props.categories[i];
                boardGridElements.push(<div className="jeffpardyCategory" key={ keyCounter++ } style={ { gridRow: 1, gridColumn: i + 1 } }><JeffpardyCategory category={ category } jeffpardyBoard={ this } /></div>);

                for (var j: number = 0; j < category.clues.length; j++) {
                    let clue: IClue = category.clues[j];
                    boardGridElements.push(<div className="jeffpardyClue" key={ keyCounter++ } style={ { gridRow: j + 2, gridColumn: i + 1 } }><JeffpardyClue jeffpardyBoard={ this } category={ category } clue={ clue } /></div>);
                }
            }
        }

        return (
            <div id="jeffpardyBoardFrame" >
                <div id="jeffpardyBoardInnerFrame">
                    <div id="jeffpardyBoard">
                        { this.state.jeopardyBoardView == JeopardyBoardView.Board &&
                            <div className="jeffpardyBoardClues">
                                { boardGridElements }
                            </div>
                        }
                        { (this.state.jeopardyBoardView == JeopardyBoardView.Clue || this.state.jeopardyBoardView == JeopardyBoardView.Question) &&
                            <div className="jeffpardyActiveClue">
                                <div className="header">{ this.state.activeCategory.title } for { this.state.activeClue.value }</div>
                                <div className="clue">{ this.state.activeClue.clue }</div>
                                { this.state.jeopardyBoardView == JeopardyBoardView.Question &&
                                    <div className="question">{ this.state.activeClue.question }</div>
                                }
                                <Timer percentageRemaining={ this.state.timerPercentageRemaining }></Timer>
                            </div>
                        }
                        { this.state.jeopardyBoardView == JeopardyBoardView.Intermission &&
                            <div className="jeffpardyIntermission">
                                Ready for... <br />
                                <div className="title">Super Jeffpardy!?</div>
                                Harder clues....Higher points
                                <p />
                                <button onClick={ this.startNewRound }>Start</button>
                            </div>
                        }
                        { this.state.jeopardyBoardView == JeopardyBoardView.End &&
                            <div className="jeffpardyEnd">
                                Thank you for playing<br />
                                <div className="title">Jeffpardy!</div>
                                <p />
                                Refresh your browser to start a new game.
                            </div>
                        }
                    </div>
                </div>
            </div >
        );
    }
}
