import * as React from "react";
import { ScoreboardEntry, ScoreboardEntryBuzzerState } from "./ScoreboardEntry";
import { Logger } from "../../../utilities/Logger";
import { JeffpardyHostController } from "../JeffpardyHostController";
import { Key, SpecialKey } from "../../../utilities/Key";
import { IPlayer, TeamDictionary, ITeam } from "../../../Types";
import { IClue } from "../Types";
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from "@material-ui/core";


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
    hilightWinningTeams: boolean;
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
    isTeamFixupDialogShown: boolean;
}

export interface IScoreboard {
    onClueShown: (clue: IClue) => void;
    onBuzzerTimeout: () => void;
    onAssignBuzzedInUser: (user: IPlayer) => void;
    onSetDailyDoubleWager: (wager: number) => void;
    clearControl: () => void;
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
            controllingUser: null,
            isTeamFixupDialogShown: false
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

    public clearControl = () => {
        this.setState({
            controllingUser: null
        })
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

    adjustTeamInfo = () => {
        this.setState({
            isTeamFixupDialogShown: true
        })
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

            // There is an edge case the the current team is null; maybe they vanished?
            // To prevent any errors, we're just going to bail out here.
            if (currentTeam == null) {
                this.showQuestion();
                return;
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
        Logger.debug("Scoreboard:render", this.props);

        this.teamCount = 0;
        let topScore: number = Number.MIN_SAFE_INTEGER;

        for (var key in this.props.teams) {
            this.teamCount++;

            let score: number = this.props.teams[key].score;
            if (score > topScore) {
                topScore = score;
            }
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
                    <div>Fixup:</div>
                    <div>
                        <button disabled={ this.state.gameBoardState != GameBoardState.Normal } onClick={ this.adjustTeamInfo }>Adjust Team Info</button>
                    </div>
                </div>

                <div className="scoreEntries">
                    { Object.keys(this.props.teams).sort().map((teamName, index) => {
                        let buzzerState = ScoreboardEntryBuzzerState.Off;
                        let userName = "";
                        let isControllingTeam: boolean = false;

                        if (this.state.gameBoardState == GameBoardState.ClueGivenBuzzerActive) {
                            buzzerState = ScoreboardEntryBuzzerState.Active
                        }

                        // If it's not a daily double and we're not in the normal mode, set the buzzer state
                        // to OffNoControl
                        if (this.state.activeClue &&
                            !this.state.activeClue.isDailyDouble &&
                            this.state.gameBoardState != GameBoardState.Normal) {
                            buzzerState = ScoreboardEntryBuzzerState.OffNoControl;
                        }

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
                            if (this.props.controllingTeam && this.props.controllingTeam.name == teamName) {
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
                                isControllingTeam={ isControllingTeam }
                                isWinningTeam={ this.props.hilightWinningTeams && (this.props.teams[teamName].score == topScore) } />
                        )
                    }) }
                </div>

                { this.state.isTeamFixupDialogShown &&
                    <Dialog
                        open={ this.state.isTeamFixupDialogShown }
                        keepMounted
                        fullWidth
                    >
                        <DialogTitle id="alert-dialog-slide-title">{ "Adjust Control & Scores" }</DialogTitle>
                        <DialogContent>
                            { Object.keys(this.props.teams).sort().map((teamName, index) => {
                                let isControllingTeam: boolean = false;
                                return (
                                    <div>
                                        <input
                                            type="radio"
                                            name="controllingTeamName"
                                            checked={ this.props.controllingTeam && this.props.controllingTeam.name == teamName }
                                            onChange={ e => this.props.jeffpardyHostController.controllingTeamChange(this.props.teams[teamName]) } />
                                        Team: { teamName }
                                        <input
                                            type="text"
                                            defaultValue={ this.props.teams[teamName].score }
                                            onChange={ e => this.props.teams[teamName].score = Number.parseInt(e.target.value, 10) } />
                                    </div>
                                )
                            })
                            }
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={ () => { this.setState({ isTeamFixupDialogShown: false }) } } color="primary">
                                OK
                        </Button>
                        </DialogActions>
                    </Dialog>
                }
            </div >
        );
    }
}
