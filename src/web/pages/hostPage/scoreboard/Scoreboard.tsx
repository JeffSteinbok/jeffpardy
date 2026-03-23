// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { ScoreboardEntry, ScoreboardEntryBuzzerState } from "./ScoreboardEntry";
import { Logger } from "../../../utilities/Logger";
import { JeffpardyHostController } from "../JeffpardyHostController";
import { IPlayer, TeamDictionary, ITeam } from "../../../Types";
import { IClue } from "../../../Types";
import { TeamFixupDialog } from "./TeamFixupDialog";
import { EndRoundDialog } from "./EndRoundDialog";
import { createKeyboardHandler } from "./useKeyboardShortcuts";

// Tracks the host scoreboard's view of the current game phase.
// Controls which keyboard shortcuts and toolbar buttons are active.
enum GameBoardState {
    Normal,
    CategoryReveal,
    ClueGiven,
    ClueGivenBuzzerActive,
    ClueAnswered,
    Question,
    Intermission,
    FinalJeffpardy, // Category shown, waiting for wagers
    FinalJeffpardyClue, // Clue revealed, waiting for timer start
    Completed,
}

export interface IScoreboardProps {
    jeffpardyHostController: JeffpardyHostController;
    teams: TeamDictionary;
    controllingTeam: ITeam;
    hilightWinningTeams: boolean;
    hostSecondaryWindowUri: string;
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
    isEndRoundDialogShown: boolean;
    isControlsCollapsed: boolean;
    wrongTeams: string[];
}

export interface IScoreboard {
    onClueShown: (clue: IClue) => void;
    onBuzzerTimeout: () => void;
    onAssignBuzzedInUser: (user: IPlayer) => void;
    onSetDailyDoubleWager: (wager: number) => void;
    onStartIntermission: () => void;
    onStartNormalRound: () => void;
    onStartCategoryReveal: () => void;
    onStartFinalJeffpardy: () => void;
    onShowFinalJeffpardyClue: () => void;
    clearControl: () => void;
}
/** Host scoreboard panel showing team scores, buzzer states, and game controls for each phase of gameplay. */
export class Scoreboard extends React.Component<IScoreboardProps, IScoreboardState> implements IScoreboard {
    private teamCount: number = 0;
    private keyboardHandler: (event: KeyboardEvent) => void;

    constructor(props: IScoreboardProps) {
        super(props);
        Logger.debug("Scoreboard:constructor");
        this.props.jeffpardyHostController.setScoreboard(this);

        this.state = {
            message: "",
            users: [],
            logMessages: [],
            buzzedInUser: null,
            gameBoardState: GameBoardState.CategoryReveal,
            activeClue: null,
            dailyDoubleWager: 0,
            numResponses: 0,
            controllingUser: null,
            isTeamFixupDialogShown: false,
            isEndRoundDialogShown: false,
            isControlsCollapsed: false,
            wrongTeams: [],
        };
    }

    resetBuzzer = () => {
        this.props.jeffpardyHostController.resetBuzzer();
        this.setState({
            numResponses: 0,
        });
    };

    activateBuzzer = () => {
        Logger.debug("Scoreboard:activateBuzzer", this.state.gameBoardState);
        if (this.state.gameBoardState == GameBoardState.ClueGiven) {
            this.props.jeffpardyHostController.activateBuzzer();
            this.setState({
                gameBoardState: GameBoardState.ClueGivenBuzzerActive,
                buzzedInUser: null,
            });
        }
    };

    onClueShown = (clue: IClue) => {
        this.setState({
            gameBoardState: clue.isDailyDouble ? GameBoardState.ClueAnswered : GameBoardState.ClueGiven,
            activeClue: clue,
            wrongTeams: [],
        });
    };

    onAssignBuzzedInUser = (user: IPlayer) => {
        this.setState({
            gameBoardState: GameBoardState.ClueAnswered,
            buzzedInUser: user,
            numResponses: this.state.numResponses + 1,
        });
    };

    onBuzzerTimeout = () => {
        this.showQuestion();
    };

    onSetDailyDoubleWager = (wager: number) => {
        Logger.debug("Scoreboard:onSetDailyDoubleWager", wager);
        this.setState({
            dailyDoubleWager: wager,
        });
    };

    onStartNormalRound = () => {
        this.setState({
            gameBoardState: GameBoardState.Normal,
        });
    };

    onStartCategoryReveal = () => {
        this.setState({
            gameBoardState: GameBoardState.CategoryReveal,
        });
    };

    onStartIntermission = () => {
        this.setState({
            gameBoardState: GameBoardState.Intermission,
        });
    };

    onStartFinalJeffpardy = () => {
        this.clearControl();
        this.setState({
            gameBoardState: GameBoardState.FinalJeffpardy,
        });
    };

    onShowFinalJeffpardyClue = () => {
        this.setState({
            gameBoardState: GameBoardState.FinalJeffpardyClue,
        });
    };
    public clearControl = () => {
        this.setState({
            controllingUser: null,
        });
    };

    showQuestion = () => {
        if (
            this.state.gameBoardState == GameBoardState.ClueGivenBuzzerActive ||
            this.state.gameBoardState == GameBoardState.ClueAnswered
        ) {
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
                buzzedInUser: null,
                wrongTeams: [],
            });
            this.resetBuzzer();
        }
    };

    startNewRound = () => {
        if (this.state.gameBoardState == GameBoardState.Intermission) {
            this.props.jeffpardyHostController.jeffpardyBoard.startNewRound();
        }
    };

    // Guard: only transition from category → clue (prevents double-press during animation)
    showFinalJeffpardyClue = () => {
        if (this.state.gameBoardState == GameBoardState.FinalJeffpardy) {
            this.props.jeffpardyHostController.jeffpardyBoard.showFinalJeffpardyClue();
        }
    };

    // Guard: only start timer once the clue is already visible
    startFinalJeffpardyTimer = () => {
        if (this.state.gameBoardState == GameBoardState.FinalJeffpardyClue) {
            this.props.jeffpardyHostController.jeffpardyBoard.startFinalJeffpardyTimer();
        }
    };

    advanceCategoryReveal = () => {
        if (this.state.gameBoardState == GameBoardState.CategoryReveal) {
            this.props.jeffpardyHostController.advanceCategoryReveal();
        }
    };

    endRound = () => {
        if (this.state.gameBoardState == GameBoardState.Normal) {
            this.setState({ isEndRoundDialogShown: true });
        }
    };

    confirmEndRound = () => {
        this.setState({ isEndRoundDialogShown: false });
        this.props.jeffpardyHostController.endRound();
    };

    correctResponse = () => {
        this.processResponse(true);
    };

    incorrectResponse = () => {
        this.processResponse(false);
    };

    adjustTeamInfo = () => {
        this.setState({
            isTeamFixupDialogShown: true,
        });
    };

    processResponse = (responseCorrect: boolean) => {
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

            const oldScore: number = currentTeam.score;

            let adjustment: number = this.state.activeClue.value;
            if (this.state.activeClue.isDailyDouble) {
                adjustment = this.state.dailyDoubleWager;
            }

            if (responseCorrect) {
                this.showQuestion();

                if (!this.state.activeClue.isDailyDouble) {
                    this.setState({
                        controllingUser: this.state.buzzedInUser,
                    });
                    this.props.jeffpardyHostController.controllingTeamChange(
                        this.props.teams[this.state.buzzedInUser.team]
                    );
                }
            } else {
                adjustment *= -1;

                const wrongTeam = this.state.buzzedInUser ? this.state.buzzedInUser.team : null;

                if (this.state.numResponses == this.teamCount || this.state.activeClue.isDailyDouble) {
                    this.showQuestion();
                } else {
                    this.setState({
                        gameBoardState: GameBoardState.ClueGiven,
                        wrongTeams: wrongTeam ? [...this.state.wrongTeams, wrongTeam] : this.state.wrongTeams,
                    });
                }
            }

            currentTeam.score = oldScore + adjustment;

            this.props.jeffpardyHostController.broadcastScores();

            // Not sure why this is here...trigger re-draw?
            this.setState({
                buzzedInUser: this.state.buzzedInUser,
            });
        }
    };

    handleKeyDown = createKeyboardHandler({
        onSpace: () => {
            if (this.state.gameBoardState == GameBoardState.Question) this.showBoard();
            else if (this.state.gameBoardState == GameBoardState.CategoryReveal) this.advanceCategoryReveal();
            else if (this.state.gameBoardState == GameBoardState.Intermission) this.startNewRound();
            else if (this.state.gameBoardState == GameBoardState.FinalJeffpardy) this.showFinalJeffpardyClue();
            else if (this.state.gameBoardState == GameBoardState.FinalJeffpardyClue) this.startFinalJeffpardyTimer();
        },
        onActivateBuzzer: () => this.activateBuzzer(),
        onCorrectResponse: () => this.correctResponse(),
        onIncorrectResponse: () => this.incorrectResponse(),
    });

    componentDidMount = () => {
        window.addEventListener("keydown", this.handleKeyDown);
    };

    componentWillUnmount() {
        window.removeEventListener("keydown", this.handleKeyDown);
    }

    public render() {
        Logger.debug("Scoreboard:render", this.props);

        this.teamCount = 0;
        let topScore: number = Number.MIN_SAFE_INTEGER;

        for (const key in this.props.teams) {
            this.teamCount++;

            const score: number = this.props.teams[key].score;
            if (score > topScore) {
                topScore = score;
            }
        }

        return (
            <div id="scoreboard">
                <div id="hostControlsDrawer" className={this.state.isControlsCollapsed ? "collapsed" : ""}>
                    <div id="hostControls">
                        <div>Board:</div>
                        <div>
                            <button
                                disabled={
                                    this.state.gameBoardState != GameBoardState.Question &&
                                    this.state.gameBoardState != GameBoardState.CategoryReveal &&
                                    this.state.gameBoardState != GameBoardState.Intermission &&
                                    this.state.gameBoardState != GameBoardState.FinalJeffpardy &&
                                    this.state.gameBoardState != GameBoardState.FinalJeffpardyClue
                                }
                                onClick={
                                    this.state.gameBoardState == GameBoardState.CategoryReveal
                                        ? this.advanceCategoryReveal
                                        : this.state.gameBoardState == GameBoardState.Intermission
                                        ? this.startNewRound
                                        : this.state.gameBoardState == GameBoardState.FinalJeffpardy
                                        ? this.showFinalJeffpardyClue
                                        : this.state.gameBoardState == GameBoardState.FinalJeffpardyClue
                                        ? this.startFinalJeffpardyTimer
                                        : this.showBoard
                                }
                            >
                                Cont (sp)
                            </button>
                            <button
                                disabled={this.state.gameBoardState != GameBoardState.Normal}
                                onClick={this.endRound}
                            >
                                End Round
                            </button>
                        </div>
                        <div>Buzzer:</div>
                        <div>
                            <button
                                disabled={this.state.gameBoardState != GameBoardState.ClueGiven}
                                onClick={this.activateBuzzer}
                            >
                                Activate (a)
                            </button>
                        </div>
                        <div>Response:</div>
                        <div>
                            <button
                                disabled={this.state.gameBoardState != GameBoardState.ClueAnswered}
                                onClick={this.correctResponse}
                            >
                                Right (z)
                            </button>
                            <button
                                disabled={this.state.gameBoardState != GameBoardState.ClueAnswered}
                                onClick={this.incorrectResponse}
                            >
                                Wrong (x)
                            </button>
                        </div>
                        <div>Fixup:</div>
                        <div>
                            <button
                                disabled={
                                    this.state.gameBoardState != GameBoardState.Normal &&
                                    this.state.gameBoardState != GameBoardState.Intermission &&
                                    this.state.gameBoardState != GameBoardState.FinalJeffpardy
                                }
                                onClick={this.adjustTeamInfo}
                            >
                                Scores
                            </button>
                            <button
                                onClick={() => {
                                    window.open(
                                        this.props.hostSecondaryWindowUri,
                                        "Jeffpardy Host Secondary Window",
                                        "width=600,height=600"
                                    );
                                }}
                            >
                                Host Window
                            </button>
                        </div>
                    </div>
                    <button
                        className="drawerToggle"
                        onClick={() => this.setState({ isControlsCollapsed: !this.state.isControlsCollapsed })}
                    >
                        {this.state.isControlsCollapsed ? "▶" : "◀"}
                    </button>
                </div>

                <div className="scoreEntries">
                    {Object.keys(this.props.teams)
                        .sort()
                        .map((teamName, index) => {
                            let buzzerState = ScoreboardEntryBuzzerState.Off;
                            let userName = "";
                            let isControllingTeam: boolean = false;

                            if (this.state.gameBoardState == GameBoardState.ClueGivenBuzzerActive) {
                                buzzerState = ScoreboardEntryBuzzerState.Active;
                            }

                            // If it's not a daily double and we're not in the normal mode, set the buzzer state
                            // to OffNoControl
                            if (
                                this.state.activeClue &&
                                !this.state.activeClue.isDailyDouble &&
                                this.state.gameBoardState != GameBoardState.Normal
                            ) {
                                buzzerState = ScoreboardEntryBuzzerState.OffNoControl;
                            }

                            if (this.state.buzzedInUser != null && this.state.buzzedInUser.team == teamName) {
                                if (this.state.gameBoardState == GameBoardState.Question) {
                                    buzzerState = ScoreboardEntryBuzzerState.CorrectAnswer;
                                } else {
                                    buzzerState = ScoreboardEntryBuzzerState.BuzzedIn;
                                }
                                userName = this.state.buzzedInUser.name;
                            }

                            if (this.state.wrongTeams.includes(teamName)) {
                                buzzerState = ScoreboardEntryBuzzerState.WrongAnswer;
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
                                    key={index}
                                    teamName={teamName}
                                    buzzerState={buzzerState}
                                    userName={userName}
                                    score={this.props.teams[teamName].score}
                                    isControllingTeam={isControllingTeam}
                                    isWinningTeam={
                                        this.props.hilightWinningTeams && this.props.teams[teamName].score == topScore
                                    }
                                />
                            );
                        })}
                </div>

                {this.state.isTeamFixupDialogShown && (
                    <TeamFixupDialog
                        teams={this.props.teams}
                        controllingTeam={this.props.controllingTeam}
                        jeffpardyHostController={this.props.jeffpardyHostController}
                        onControllingUserClear={() => this.setState({ controllingUser: null })}
                        onClose={() => {
                            this.props.jeffpardyHostController.broadcastScores();
                            this.setState({ isTeamFixupDialogShown: false });
                            (document.activeElement as HTMLElement)?.blur();
                        }}
                    />
                )}

                {this.state.isEndRoundDialogShown && (
                    <EndRoundDialog
                        onConfirm={this.confirmEndRound}
                        onClose={() => {
                            this.setState({ isEndRoundDialogShown: false });
                            (document.activeElement as HTMLElement)?.blur();
                        }}
                    />
                )}
            </div>
        );
    }
}
