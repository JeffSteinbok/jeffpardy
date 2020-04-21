import * as React from "react";
import { ScoreboardEntry, ScoreboardEntryBuzzerState } from "./ScoreboardEntry";
import { Logger } from "../../utilities/Logger";
import { JeffpardyHostController, ITeam } from "../../JeffpardyHostController";
import { Key, SpecialKey } from "../../utilities/Key";
import { HostPageViewMode } from "../../HostPage";
import { IPlayer } from "../../interfaces/IPlayer";


enum GameBoardState {
    Normal,
    ClueGiven,
    ClueGivenBuzzerActive,
    ClueAnswered,
    Question,
    Completed
}

export interface IScoreboardProps {
    jeffpardyHostController: JeffpardyHostController;
    teams: { [key: string]: ITeam };
}

export interface IScoreboardState {
    message: string;
    users: IPlayer[];
    logMessages: string[];
    buzzedInUser: IPlayer;
    gameBoardState: GameBoardState;
    activeClueValue: number;
    numResponses: number;
}

export interface IScoreboard {
    onClueShown: (clueValue: number) => void;
    onBuzzerTimeout: () => void;
    onAssignBuzzedInUser: (user: IPlayer) => void;
}
/**
 * Top bar containing toolbar buttons and drop downs
 */
export class Scoreboard extends React.Component<IScoreboardProps, IScoreboardState> implements IScoreboard {

    private teamCount: number = 0;
    constructor(props: any) {
        super(props);
        Logger.debug("Scoreboard:constructor");
        this.props.jeffpardyHostController.setScoreboard(this);


        this.state = {
            message: '',
            users: [],
            logMessages: [],
            buzzedInUser: null,
            gameBoardState: GameBoardState.Normal,
            activeClueValue: 0,
            numResponses: 0
        };
    }

    resetBuzzer = () => {
        this.props.jeffpardyHostController.resetBuzzer();
        this.setState({
            numResponses: 0
        });
    };

    activateBuzzer = () => {
        Logger.debug("Scoreboard:activateBuzzer", this.state.gameBoardState)
        if (this.state.gameBoardState == GameBoardState.ClueGiven) {

            this.props.jeffpardyHostController.activateBuzzer();
            this.setState({
                gameBoardState: GameBoardState.ClueGivenBuzzerActive,
                buzzedInUser: null
            });
        }
    };

    onClueShown = (clueValue: number) => {
        this.setState({
            gameBoardState: GameBoardState.ClueGiven,
            activeClueValue: clueValue
        });
    };

    onAssignBuzzedInUser = (user: IPlayer) => {
        this.setState({
            gameBoardState: GameBoardState.ClueAnswered,
            buzzedInUser: user,
            numResponses: this.state.numResponses + 1
        });
    }

    onBuzzerTimeout = () => {
        this.showQuestion();
    }

    showQuestion = () => {
        if ((this.state.gameBoardState == GameBoardState.ClueGivenBuzzerActive) ||
            (this.state.gameBoardState == GameBoardState.ClueAnswered)) {
            this.props.jeffpardyHostController.showQuestion();
            this.setState({ gameBoardState: GameBoardState.Question });
            this.resetBuzzer();
        }
    };

    showBoard = () => {
        if (this.state.gameBoardState == GameBoardState.Question) {
            this.props.jeffpardyHostController.showBoard();
            this.setState({
                gameBoardState: GameBoardState.Normal,
                buzzedInUser: null
            });
            this.resetBuzzer();
        }
    };

    correctResponse = () => {
        this.processResponse(true);
    }

    incorrectResponse = () => {
        this.processResponse(false);
    }

    processResponse = (responseCorrect: Boolean) => {

        if (this.state.gameBoardState == GameBoardState.ClueAnswered) {

            let oldScore: number = 0;
            if (this.props.teams[this.state.buzzedInUser.team] != null) {
                oldScore = this.props.teams[this.state.buzzedInUser.team].score;
            }
            let adjustment: number = this.state.activeClueValue;

            if (responseCorrect) {
                this.showQuestion();
                // TODO:  Set who has control
            } else {
                adjustment *= -1;

                if (this.state.numResponses == this.teamCount) {
                    this.showQuestion();
                } else {
                    this.setState({
                        gameBoardState: GameBoardState.ClueGiven
                    });
                }

            }

            this.props.teams[this.state.buzzedInUser.team].score = oldScore + adjustment;
            this.setState({
                buzzedInUser: this.state.buzzedInUser
            })
        };
    }


    handleKeyDown = (event: KeyboardEvent) => {
        switch (event.keyCode) {
            case SpecialKey.SPACE:
                if (this.state.gameBoardState == GameBoardState.Question)
                    this.showBoard();
                break;
            case Key.A:
                this.activateBuzzer();
                break;
            case Key.Z:
                this.correctResponse();
                break;
            case Key.X:
                this.incorrectResponse();
                break;
        }
    }

    componentDidMount = () => {
        window.addEventListener("keydown", this.handleKeyDown)
    }

    componentWillUnmount() {
        window.removeEventListener("keydown", this.handleKeyDown);
    }

    public render() {

        this.teamCount = 0;
        for (var key in this.props.teams) {
            this.teamCount++;
        }

        return (
            <div id="scoreboard">
                <div id="hostControls">
                    <div>Board:</div>
                    <div>
                        <button disabled={ this.state.gameBoardState != GameBoardState.Question } onClick={ this.showBoard }>Cont (sp)</button>
                    </div>
                    <div>Buzzer:</div>
                    <div>
                        <button disabled={ (this.state.gameBoardState != GameBoardState.ClueGiven) } onClick={ this.activateBuzzer }>Activate (a)</button>
                    </div>
                    <div>Response:</div>
                    <div>
                        <button disabled={ this.state.gameBoardState != GameBoardState.ClueAnswered } onClick={ this.correctResponse }>Right (z)</button>
                        <button disabled={ this.state.gameBoardState != GameBoardState.ClueAnswered } onClick={ this.incorrectResponse }>Wrong (x)</button>
                    </div>
                </div>

                <div className="scoreEntries">
                    { Object.keys(this.props.teams).sort().map((teamName, index) => {
                        let buzzerState = ScoreboardEntryBuzzerState.Off;
                        let buzzedInUserName = "";
                        if (this.state.gameBoardState == GameBoardState.ClueGivenBuzzerActive) { buzzerState = ScoreboardEntryBuzzerState.Active }
                        if (this.state.buzzedInUser != null && this.state.buzzedInUser.team == teamName) {
                            buzzerState = ScoreboardEntryBuzzerState.BuzzedIn;
                            buzzedInUserName = this.state.buzzedInUser.name;
                        }

                        return (
                            <ScoreboardEntry
                                key={ index }
                                teamName={ teamName }
                                buzzerState={ buzzerState }
                                buzzedInUserName={ buzzedInUserName }
                                score={ this.props.teams[teamName].score } />
                        )
                    }) }
                </div>
            </div>
        );
    }
}
