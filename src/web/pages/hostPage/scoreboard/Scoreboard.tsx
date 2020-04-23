import * as React from "react";
import { ScoreboardEntry, ScoreboardEntryBuzzerState } from "./ScoreboardEntry";
import { Logger } from "../../../utilities/Logger";
import { JeffpardyHostController } from "../JeffpardyHostController";
import { Key, SpecialKey } from "../../../utilities/Key";
import { HostPageViewMode } from "../HostPage";
import { IPlayer, TeamDictionary, ITeam } from "../../../Types";
import { timingSafeEqual } from "crypto";
import { IClue } from "../Types";


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
    teams: TeamDictionary;
    controllingTeam: ITeam;
}

export interface IScoreboardState {
    message: string;
    users: IPlayer[];
    logMessages: string[];
    buzzedInUser: IPlayer;
    gameBoardState: GameBoardState;
    activeClue: IClue;
    dailyDoubleWager: number;
    numResponses: number;
    controllingUser: IPlayer;
}

export interface IScoreboard {
    onClueShown: (clue: IClue) => void;
    onBuzzerTimeout: () => void;
    onAssignBuzzedInUser: (user: IPlayer) => void;
    onSetDailyDoubleWager: (wager: number) => void;
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
            activeClue: null,
            dailyDoubleWager: 0,
            numResponses: 0,
            controllingUser: null
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

    onClueShown = (clue: IClue) => {
        this.setState({
            gameBoardState: clue.isDailyDouble ? GameBoardState.ClueAnswered : GameBoardState.ClueGiven,
            activeClue: clue
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

    onSetDailyDoubleWager = (wager: number) => {
        Logger.debug("Scoreboard:onSetDailyDoubleWager", wager)
        this.setState({
            dailyDoubleWager: wager
        });
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

            let currentTeam: ITeam;

            // If it's a daily double, there is no buzzed in user.
            if (this.state.activeClue.isDailyDouble) {
                if (this.state.controllingUser != null) {
                    currentTeam = this.props.teams[this.state.controllingUser.team];
                } else {
                    currentTeam = this.props.controllingTeam;
                }
            } else {
                if (this.props.teams[this.state.buzzedInUser.team] != null) {
                    currentTeam = this.props.teams[this.state.buzzedInUser.team];
                }
            }

            let oldScore: number = currentTeam.score;

            let adjustment: number = this.state.activeClue.value;
            if (this.state.activeClue.isDailyDouble) {
                adjustment = this.state.dailyDoubleWager;
            }

            if (responseCorrect) {
                this.showQuestion();

                if (!this.state.activeClue.isDailyDouble) {

                    this.setState({
                        controllingUser: this.state.buzzedInUser
                    });
                    this.props.jeffpardyHostController.controllingTeamChange(this.props.teams[this.state.buzzedInUser.team]);
                }
            } else {
                adjustment *= -1;

                if ((this.state.numResponses == this.teamCount) || this.state.activeClue.isDailyDouble) {
                    this.showQuestion();
                } else {
                    this.setState({
                        gameBoardState: GameBoardState.ClueGiven
                    });
                }

            }

            currentTeam.score = oldScore + adjustment;

            // Not sure why this is here...trigger re-draw?
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
                        <button disabled={ this.state.gameBoardState != GameBoardState.ClueGiven } onClick={ this.activateBuzzer }>Activate (a)</button>
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
                        let userName = "";
                        let isControllingTeam: boolean = false;

                        if (this.state.gameBoardState == GameBoardState.ClueGivenBuzzerActive) { buzzerState = ScoreboardEntryBuzzerState.Active }
                        if (this.state.buzzedInUser != null && this.state.buzzedInUser.team == teamName) {
                            buzzerState = ScoreboardEntryBuzzerState.BuzzedIn;
                            userName = this.state.buzzedInUser.name;
                        }

                        if (this.state.controllingUser != null) {
                            if (this.state.controllingUser.team == teamName) {
                                isControllingTeam = true;
                                if (buzzerState == ScoreboardEntryBuzzerState.Off) {
                                    userName = this.state.controllingUser.name;
                                }
                            }
                        } else {
                            // Use the initial version from props.
                            if (this.props.controllingTeam.name == teamName) {
                                isControllingTeam = true;
                            }
                        }

                        return (
                            <ScoreboardEntry
                                key={ index }
                                teamName={ teamName }
                                buzzerState={ buzzerState }
                                userName={ userName }
                                score={ this.props.teams[teamName].score }
                                isControllingTeam={ isControllingTeam } />
                        )
                    }) }
                </div>
            </div >
        );
    }
}
