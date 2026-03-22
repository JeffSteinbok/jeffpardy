// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { Logger } from "../../../utilities/Logger";
import { JeffpardyHostController } from "../JeffpardyHostController";
import { Timer } from "./Timer";
import { FinalJeffpardyAnswerDictionary, FinalJeffpardyWagerDictionary } from "../Types";
import { ICategory, IClue, ITeam, TeamDictionary } from "../../../Types";
import { Debug, DebugFlags } from "../../../utilities/Debug";
import { FinalJeffpardySubmissionList } from "./FinalJeffpardySubmissionList";
import { FinalJeffpardyTally } from "./FinalJeffpardyTally";
import { HostPageViewMode } from "../HostPage";
import { GameBoardGrid } from "./GameBoardGrid";
import { CategoryReveal } from "./CategoryReveal";
import { DailyDoubleReveal } from "./DailyDoubleReveal";
import { ClueDisplay } from "./ClueDisplay";
import { RoundIntermission } from "./RoundIntermission";

export enum JeopardyBoardView {
    Board,
    CategoryReveal,
    DailyDouble,
    Clue,
    Question,
    Intermission,
    FinalCategory,
    FinalClue,
    FinalTally,
}

export interface IJeffpardyBoardProps {
    jeffpardyHostController: JeffpardyHostController;
    round: number;
    categories: ICategory[];
    controllingTeam: ITeam;
    teams: TeamDictionary;
    finalJeffpardyWagers: FinalJeffpardyWagerDictionary;
    finalJeffpardyAnswers: FinalJeffpardyAnswerDictionary;
    onScoreChange: (team: ITeam, newScore: number) => void;
}

export interface IJeffpardyBoardState {
    activeClue: IClue;
    activeCategory: ICategory;
    jeopardyBoardView: JeopardyBoardView;
    timerPercentageRemaining: number;
    finalJeffpardyTimerActive: boolean;
    revealCategoryIndex: number;
    revealShowingName: boolean;
    dailyDoubleRevealed: boolean;
    wagerError: string;
    boardFillRevealed: Set<number>;
    finalCategoryRevealing: boolean;
    finalCategorySettling: boolean;
}

export interface IJeffpardyBoard {
    showClue: (category: ICategory, clue: IClue) => void;
    showQuestion: () => void;
    showBoard: () => void;
    startTimer: () => void;
    stopTimer: () => void;
    endRound: () => void;
    advanceCategoryReveal: () => void;
    showFinalJeffpardyClue: () => void;
    startFinalJeffpardyTimer: () => void;
}

/** Manages the main game board view, including clue display, category reveal, daily doubles, and Final Jeffpardy phases. */
export class JeffpardyBoard
    extends React.Component<IJeffpardyBoardProps, IJeffpardyBoardState>
    implements IJeffpardyBoard
{
    private contextMenuTarget: HTMLElement;
    private categories: ICategory = null;
    private timerHandle: ReturnType<typeof setInterval>;
    private timerDurationInSeconds: number;
    private timerRemainingDurationInSeconds: number;
    private dailyDoubleBetTemp: string;
    private revealNameTimeout: ReturnType<typeof setTimeout>;
    private boardFillTimeout: ReturnType<typeof setTimeout>;

    // Pre-cache all sound effects
    private finalRevealSound: HTMLAudioElement = new Audio("/sounds/finalJeffpardyReveal.mp3");
    private boardFillSound: HTMLAudioElement = new Audio("/sounds/boardFill.mp3");
    private dailyDoubleSound: HTMLAudioElement = new Audio("/sounds/dailyDouble.mp3");
    private finalJeopardySound: HTMLAudioElement = new Audio("/sounds/finalJeopardy.mp3");

    private getRoundLogoSrc = (): string => {
        const roundName = this.props.jeffpardyHostController.gameData.rounds[this.props.round].name;
        if (roundName.toLowerCase().includes("super")) return "/images/SuperJeffpardy.png";
        if (roundName.toLowerCase().includes("final")) return "/images/FinalJeffpardy.png";
        return "/images/Jeffpardy.png";
    };

    constructor(props: IJeffpardyBoardProps) {
        super(props);

        Logger.debug("JeffpardyBoard:constructor", this.props.categories);

        this.timerDurationInSeconds = 5;
        if (Debug.IsFlagSet(DebugFlags.ShortTimers)) {
            this.timerDurationInSeconds = 1;
        }

        // HACK HACK
        let boardView: JeopardyBoardView = JeopardyBoardView.CategoryReveal;
        if (Debug.IsFlagSet(DebugFlags.SkipCategoryReveal)) {
            boardView = JeopardyBoardView.Board;
        }
        if (Debug.IsFlagSet(DebugFlags.FinalJeffpardy)) {
            boardView = JeopardyBoardView.Intermission;
        }

        this.state = {
            jeopardyBoardView: boardView,
            activeClue: null,
            activeCategory: null,
            timerPercentageRemaining: 1,
            finalJeffpardyTimerActive: false,
            revealCategoryIndex: -1, // -1 = showing placeholder board, 0+ = filmstrip reveal
            revealShowingName: false,
            dailyDoubleRevealed: false,
            wagerError: null,
            boardFillRevealed: new Set<number>(),
            // Animation state machine for Final Jeffpardy category reveal:
            // revealing (3s zoom/scale CSS) → settling (0.8s ease-out transition) → idle
            finalCategoryRevealing: false,
            finalCategorySettling: false,
        };

        this.props.jeffpardyHostController.setJeffpardyBoard(this);
    }

    componentDidMount() {
        // Pre-cache all sound effects
        this.finalRevealSound.load();
        this.boardFillSound.load();
        this.dailyDoubleSound.load();
        this.finalJeopardySound.load();

        // Start board fill animation for round 1
        if (this.state.jeopardyBoardView === JeopardyBoardView.CategoryReveal && this.props.round === 0) {
            this.startBoardFill();
        }
    }

    componentWillUnmount() {
        if (this.boardFillTimeout) clearTimeout(this.boardFillTimeout);
    }

    private startBoardFill = () => {
        if (!this.props.categories) return;
        const totalCells = this.props.categories.length * this.props.categories[0].clues.length;
        const interval = 3600 / totalCells;

        // Build shuffled indices
        const indices: number[] = [];
        for (let i = 0; i < totalCells; i++) indices.push(i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        this.boardFillSound.play();
        let count = 0;
        const revealNext = () => {
            this.setState((prev) => {
                const revealed = new Set(prev.boardFillRevealed);
                revealed.add(indices[count]);
                count++;
                return { boardFillRevealed: revealed };
            });
            if (count < totalCells) {
                this.boardFillTimeout = setTimeout(revealNext, interval);
            }
        };
        this.boardFillTimeout = setTimeout(revealNext, interval);
    };

    public advanceCategoryReveal = () => {
        if (this.revealNameTimeout) {
            clearTimeout(this.revealNameTimeout);
            this.revealNameTimeout = null;
        }

        if (this.state.revealCategoryIndex === -1) {
            // Move from placeholder board to first category filmstrip
            this.setState({ revealCategoryIndex: 0, revealShowingName: false });
            this.scheduleNameReveal();
        } else {
            const nextIndex = this.state.revealCategoryIndex + 1;
            if (this.props.categories && nextIndex >= this.props.categories.length) {
                // Done revealing — show the real board, notify scoreboard
                this.setState({
                    jeopardyBoardView: JeopardyBoardView.Board,
                    revealCategoryIndex: -1,
                    revealShowingName: false,
                });
                this.props.jeffpardyHostController.onCategoryRevealComplete();
            } else {
                this.setState({ revealCategoryIndex: nextIndex, revealShowingName: false });
                this.scheduleNameReveal();
            }
        }
    };

    private scheduleNameReveal = () => {
        this.revealNameTimeout = setTimeout(() => {
            this.setState({ revealShowingName: true });
        }, 600);
    };

    public showClue = (category: ICategory, clue: IClue) => {
        if (clue.isDailyDouble && this.state.jeopardyBoardView == JeopardyBoardView.Board) {
            this.setState({
                activeClue: clue,
                activeCategory: category,
                jeopardyBoardView: JeopardyBoardView.DailyDouble,
                dailyDoubleRevealed: false,
            });
            // After the sound/animation plays, reveal the wager form
            setTimeout(() => {
                this.setState({ dailyDoubleRevealed: true });
            }, 3000);
        } else {
            this.setState({
                activeClue: clue,
                activeCategory: category,
                jeopardyBoardView: JeopardyBoardView.Clue,
            });
            this.props.jeffpardyHostController.showClue(clue);
        }
    };

    public showQuestion = () => {
        this.stopTimer();

        this.setState({
            jeopardyBoardView: JeopardyBoardView.Question,
        });
    };

    public showBoard = () => {
        this.clearTimer();

        // Are all the clues used?
        let boardEmpty: boolean = true;
        for (let i = 0; i < this.props.categories.length; i++) {
            if (!this.props.categories[i].isAsked) {
                boardEmpty = false;
            }
        }

        let newBoardView: JeopardyBoardView = JeopardyBoardView.Board;
        this.props.jeffpardyHostController.startIntermission();
        if (boardEmpty) {
            newBoardView = JeopardyBoardView.Intermission;
        }

        this.setState({
            activeClue: null,
            activeCategory: null,
            jeopardyBoardView: newBoardView,
        });
    };

    public startNewRound = () => {
        const numRounds: number = this.props.jeffpardyHostController.gameData.rounds.length;

        if (this.props.round < numRounds - 1) {
            this.props.jeffpardyHostController.startNewRound();
            this.setState({
                jeopardyBoardView: JeopardyBoardView.CategoryReveal,
                revealCategoryIndex: -1,
                revealShowingName: false,
            });
        } else {
            // Final Jeffpardy category reveal animation: a chained setTimeout drives the
            // state machine: revealing (3s) → settling (0.8s) → idle.
            // CSS classes are applied based on these flags (see render).
            this.finalRevealSound.play();
            this.props.jeffpardyHostController.startFinalJeffpardy();
            this.setState({
                jeopardyBoardView: JeopardyBoardView.FinalCategory,
                finalCategoryRevealing: true,
                finalCategorySettling: false,
            });
            setTimeout(() => {
                // Transition from revealing → settling (ease-out)
                this.setState({
                    finalCategoryRevealing: false,
                    finalCategorySettling: true,
                });
                setTimeout(() => {
                    // Animation complete — UI elements hidden during animation are now shown
                    this.setState({ finalCategorySettling: false });
                }, 800);
            }, 3000);
        }
    };

    public endRound = () => {
        // Mark all the questions completed and show the board.
        for (let i = 0; i < this.props.categories.length; i++) {
            this.props.categories[i].isAsked = true;
        }

        this.showBoard();
    };

    showFinalJeffpardyClue = () => {
        // Block advancing to the clue while the category reveal animation is still playing
        if (this.state.finalCategoryRevealing || this.state.finalCategorySettling) return;
        this.props.jeffpardyHostController.showFinalJeffpardyClue(this.props.categories[0].clues[0]);
        this.props.jeffpardyHostController.scoreboard.onShowFinalJeffpardyClue();
        this.setState({
            jeopardyBoardView: JeopardyBoardView.FinalClue,
        });
    };

    startFinalJeffpardyTimer = () => {
        this.setState({
            finalJeffpardyTimerActive: true,
        });
        // Extra time for the song to end.
        this.timerDurationInSeconds = Debug.IsFlagSet(DebugFlags.FastFinalJeffpardy) ? 5 : 31;
        this.startTimer();
    };

    public validateAndSubmitDailyDoubleBet = (maxBet: number) => {
        const ddBet = Number.parseInt(this.dailyDoubleBetTemp, 10);
        if (isNaN(ddBet) || ddBet > maxBet || ddBet < 0) {
            this.setState({ wagerError: "Please enter a wager between 0 and " + maxBet + "." });
            setTimeout(() => {
                this.setState({ wagerError: null });
            }, 3000);
            return;
        } else {
            this.setState({ wagerError: null });
            this.props.jeffpardyHostController.setDailyDoubleWager(ddBet);
            this.showClue(this.state.activeCategory, this.state.activeClue);
        }
    };

    public startTimer = () => {
        this.timerRemainingDurationInSeconds = this.timerDurationInSeconds;
        this.timerHandle = setTimeout(this.onTimerFire, 250);
    };

    public stopTimer = () => {
        clearTimeout(this.timerHandle);
    };

    public clearTimer = () => {
        this.setState({
            timerPercentageRemaining: 1,
        });
    };

    public onTimerFire = () => {
        this.timerRemainingDurationInSeconds = this.timerRemainingDurationInSeconds - 0.25;
        const percentRemaing = this.timerRemainingDurationInSeconds / this.timerDurationInSeconds;
        if (percentRemaing != this.state.timerPercentageRemaining) {
            this.setState({
                timerPercentageRemaining: percentRemaing,
            });
        }
        if (percentRemaing > 0) {
            this.timerHandle = setTimeout(this.onTimerFire, 250);
        } else {
            // Time's up!
            if (this.state.jeopardyBoardView == JeopardyBoardView.FinalClue) {
                this.props.jeffpardyHostController.endFinalJeffpardy();
                this.setState({
                    jeopardyBoardView: JeopardyBoardView.FinalTally,
                    finalJeffpardyTimerActive: false,
                });
            } else {
                this.props.jeffpardyHostController.buzzerTimeout();
            }
        }
    };

    onTallyCompleted = () => {
        Logger.debug("JeffpardyBoard:onTallyCompleted");
        this.props.jeffpardyHostController.setViewMode(HostPageViewMode.End);
    };

    private getDailyDoubleMaxBet = (): number => {
        if (this.props.controllingTeam != null) {
            const currentTeamScore: number = this.props.controllingTeam.score;
            return Math.max(currentTeamScore, 2 * (500 * (this.props.round + 1)));
        }
        return 0;
    };

    public render() {
        Logger.debug("JeffpardyBoard:render", this.props.categories);

        const dailyDoubleMaxBet =
            this.state.activeClue != null && this.state.activeClue.isDailyDouble ? this.getDailyDoubleMaxBet() : 0;

        return (
            <div id="jeffpardyBoardFrame">
                <div id="jeffpardyBoardInnerFrame">
                    <div id="jeffpardyBoard">
                        {this.state.jeopardyBoardView == JeopardyBoardView.Board &&
                            this.props.categories &&
                            this.state.activeClue == null && (
                                <GameBoardGrid categories={this.props.categories} jeffpardyBoard={this} />
                            )}
                        {this.state.jeopardyBoardView == JeopardyBoardView.CategoryReveal && (
                            <CategoryReveal
                                categories={this.props.categories}
                                round={this.props.round}
                                revealCategoryIndex={this.state.revealCategoryIndex}
                                revealShowingName={this.state.revealShowingName}
                                boardFillRevealed={this.state.boardFillRevealed}
                                roundLogoSrc={this.getRoundLogoSrc()}
                            />
                        )}
                        {(this.state.jeopardyBoardView == JeopardyBoardView.Clue ||
                            this.state.jeopardyBoardView == JeopardyBoardView.Question) && (
                            <ClueDisplay
                                activeCategory={this.state.activeCategory}
                                activeClue={this.state.activeClue}
                                showQuestion={this.state.jeopardyBoardView == JeopardyBoardView.Question}
                                timerPercentageRemaining={this.state.timerPercentageRemaining}
                            />
                        )}
                        {this.state.jeopardyBoardView == JeopardyBoardView.DailyDouble && (
                            <DailyDoubleReveal
                                activeCategory={this.state.activeCategory}
                                activeClue={this.state.activeClue}
                                dailyDoubleMaxBet={dailyDoubleMaxBet}
                                dailyDoubleRevealed={this.state.dailyDoubleRevealed}
                                wagerError={this.state.wagerError}
                                onWagerInputChange={(value) => {
                                    this.dailyDoubleBetTemp = value;
                                }}
                                onSubmitWager={(maxBet) => {
                                    this.validateAndSubmitDailyDoubleBet(maxBet);
                                }}
                            />
                        )}
                        {this.state.jeopardyBoardView == JeopardyBoardView.Intermission && (
                            <RoundIntermission
                                round={this.props.round}
                                totalNonFinalRounds={this.props.jeffpardyHostController.gameData.rounds.length}
                                onStartNewRound={this.startNewRound}
                            />
                        )}
                        {/* Final views share a wrapper; "revealing"/"settling" CSS classes
                            drive the zoom-in and ease-out animations for the category name */}
                        {(this.state.jeopardyBoardView == JeopardyBoardView.FinalCategory ||
                            this.state.jeopardyBoardView == JeopardyBoardView.FinalClue ||
                            this.state.jeopardyBoardView == JeopardyBoardView.FinalTally) && (
                            <div
                                className={
                                    "jeffpardyFinal" +
                                    (this.state.finalCategoryRevealing ? " revealing" : "") +
                                    (this.state.finalCategorySettling ? " settling" : "")
                                }
                            >
                                {!this.state.finalCategoryRevealing && (
                                    <>
                                        The category for Final Jeffpardy is:
                                        <br />
                                    </>
                                )}
                                <div className="category">{this.props.categories[0].title}</div>
                                {!this.state.finalCategoryRevealing && (
                                    <div className="categoryDate">
                                        {new Date(this.props.categories[0].airDate).toLocaleDateString()}
                                    </div>
                                )}
                                {!this.state.finalCategoryRevealing && !this.state.finalCategorySettling && (
                                    <div className="finalTallyDivider"></div>
                                )}

                                {!this.state.finalCategoryRevealing &&
                                    !this.state.finalCategorySettling &&
                                    this.state.jeopardyBoardView == JeopardyBoardView.FinalCategory && (
                                        <div className="jeffpardyFinalCategory">
                                            <FinalJeffpardySubmissionList
                                                teams={this.props.teams}
                                                submissions={this.props.finalJeffpardyWagers}
                                                waitingText="⏳"
                                                receivedText="🔒"
                                            />

                                            <div className="categoryRevealHint">Hit Space to Show Clue</div>
                                        </div>
                                    )}
                                {this.state.jeopardyBoardView == JeopardyBoardView.FinalClue && (
                                    <div className="jeffpardyFinalClue">
                                        {this.state.finalJeffpardyTimerActive && (
                                            <audio autoPlay>
                                                <source src="/sounds/finalJeopardy.mp3" type="audio/mp3" />
                                            </audio>
                                        )}
                                        <div className="clue">{this.props.categories[0].clues[0].clue}</div>
                                        {!this.state.finalJeffpardyTimerActive && (
                                            <div className="categoryRevealHint">Hit Space to Start Timer</div>
                                        )}
                                        <div className="flexGrowSpacer"></div>
                                        <Timer percentageRemaining={this.state.timerPercentageRemaining}></Timer>
                                    </div>
                                )}
                                {this.state.jeopardyBoardView == JeopardyBoardView.FinalTally && (
                                    <div className="jeffpardyFinalTally">
                                        <div className="clue">{this.props.categories[0].clues[0].clue}</div>
                                        <FinalJeffpardyTally
                                            teams={this.props.teams}
                                            wagers={this.props.finalJeffpardyWagers}
                                            answers={this.props.finalJeffpardyAnswers}
                                            onScoreChange={this.props.onScoreChange}
                                            onTallyCompleted={this.onTallyCompleted}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}
