// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { IPlayer, TeamDictionary, ITeam } from "../../../Types";
import { Logger } from "../../../utilities/Logger";
import { FinalJeffpardyAnswerDictionary, FinalJeffpardyWagerDictionary } from "../Types";
import { Key, SpecialKey } from "../../../utilities/Key";

export interface IFinalJeffpardyTallyProps {
    teams: TeamDictionary;
    wagers: FinalJeffpardyWagerDictionary;
    answers: FinalJeffpardyAnswerDictionary;
    onScoreChange: (team: ITeam, newScore: number) => void;
    onBroadcastScores: () => void;
    onTallyCompleted: () => void;
}

export interface IFinalJeffpardyTallyState {
    revealStep: number;
    currentTeamIndex: number;
    isTallyCompleted: boolean;
    isTransitioning: boolean;
    showResult: boolean;
}

interface ITallyPlayer {
    name: string;
    wager: number;
    answer: string;
    responseTime: number;
}

interface ITallyTeam {
    name: string;
    score: number;
    players: ITallyPlayer[];
    isCorrect: boolean;
}

/** Manages the Final Jeffpardy tally phase, revealing one team at a time with slide-in animation. */
export class FinalJeffpardyTally extends React.Component<IFinalJeffpardyTallyProps, IFinalJeffpardyTallyState> {
    tallyTeams: ITallyTeam[] = [];

    constructor(props: IFinalJeffpardyTallyProps) {
        super(props);

        Logger.debug("FinalJeffpardyTally:constructor", this.props.teams);

        for (const key in this.props.teams) {
            if (Object.prototype.hasOwnProperty.call(this.props.teams, key)) {
                const team: ITeam = this.props.teams[key];

                const tallyTeam: ITallyTeam = {
                    name: team.name,
                    score: team.score,
                    players: [],
                    isCorrect: false,
                };

                team.players.forEach((player: IPlayer) => {
                    if (player.connectionId in this.props.wagers) {
                        const tallyPlayer: ITallyPlayer = {
                            name: player.name,
                            wager: this.props.wagers[player.connectionId],
                            answer:
                                player.connectionId in this.props.answers
                                    ? this.props.answers[player.connectionId].answer
                                    : null,
                            responseTime:
                                player.connectionId in this.props.answers
                                    ? this.props.answers[player.connectionId].responseTime
                                    : 0,
                        };

                        tallyTeam.players.push(tallyPlayer);
                    }
                });
                tallyTeam.players.sort((a: ITallyPlayer, b: ITallyPlayer): number => {
                    if (a.wager < b.wager) return -1;
                    else if (a.wager > b.wager) return 1;
                    else if (a.responseTime > b.responseTime) return -1;
                    else if (a.responseTime < b.responseTime) return 1;
                    return 0;
                });
                this.tallyTeams.push(tallyTeam);
            }

            this.tallyTeams.sort((a: ITallyTeam, b: ITallyTeam): number => {
                return a.score - b.score;
            });
        }

        this.state = {
            revealStep: 0,
            currentTeamIndex: 0,
            isTallyCompleted: this.tallyTeams.length === 0,
            isTransitioning: false,
            showResult: false,
        };
    }

    handleKeyDown = (event: KeyboardEvent) => {
        if (this.state.isTransitioning || this.state.isTallyCompleted || this.state.showResult) return;

        switch (event.key.toLowerCase()) {
            case SpecialKey.SPACE:
                Logger.debug("FinalJeffpardyTally:handleKeyDown", this.state.revealStep + 1);
                this.setState({
                    revealStep: this.state.revealStep + 1,
                });
                break;
            case Key.Z:
                this.correctResponse();
                break;
            case Key.X:
                this.incorrectResponse();
                break;
        }
    };

    componentDidMount = () => {
        window.addEventListener("keydown", this.handleKeyDown);
    };

    componentWillUnmount() {
        window.removeEventListener("keydown", this.handleKeyDown);
    }

    correctResponse = () => {
        this.processResponse(true);
    };

    incorrectResponse = () => {
        this.processResponse(false);
    };

    processResponse = (isCorrect: boolean) => {
        if (this.state.isTransitioning || this.state.isTallyCompleted || this.state.showResult) return;

        const tallyTeam: ITallyTeam = this.tallyTeams[this.state.currentTeamIndex];
        const currentPlayers = tallyTeam.players;
        const totalRevealSteps = currentPlayers.length * 2;
        if (this.state.revealStep < totalRevealSteps) return;

        let maxWager = 0;
        if (currentPlayers.length > 0) {
            maxWager = currentPlayers[currentPlayers.length - 1].wager;
        }
        const teamObject: ITeam = this.props.teams[tallyTeam.name];
        tallyTeam.isCorrect = isCorrect;

        let adjustment: number = maxWager;
        if (!isCorrect) {
            adjustment *= -1;
        }

        this.props.onScoreChange(teamObject, teamObject.score + adjustment);
        tallyTeam.score = teamObject.score;
        this.props.onBroadcastScores();

        // Show result briefly, then transition
        this.setState({ showResult: true });

        const newTeamIndex = this.state.currentTeamIndex + 1;

        setTimeout(() => {
            if (newTeamIndex >= this.tallyTeams.length) {
                this.setState({ isTallyCompleted: true, showResult: false });
                setTimeout(() => {
                    this.props.onTallyCompleted();
                }, 500);
            } else {
                this.setState({ isTransitioning: true });
                setTimeout(() => {
                    this.setState({
                        currentTeamIndex: newTeamIndex,
                        revealStep: 0,
                        isTransitioning: false,
                        showResult: false,
                    });
                }, 800);
            }
        }, 500);
    };

    public render() {
        Logger.debug("FinalJeffpardyTally:render", this.props.teams);

        if (this.tallyTeams.length === 0) return null;

        const tallyTeam = this.tallyTeams[this.state.currentTeamIndex];
        if (!tallyTeam) return null;

        let revealCurrStep = 0;
        const shouldRender = (): boolean => {
            return ++revealCurrStep <= this.state.revealStep;
        };

        const totalRevealSteps = tallyTeam.players.length * 2;
        const allRevealed = this.state.revealStep >= totalRevealSteps;

        return (
            <div className="finalTallySingleTeam">
                <div className="tallyProgress">
                    {this.tallyTeams.map((_, i) => (
                        <div
                            key={i}
                            className={
                                "tallyProgressDot" +
                                (i < this.state.currentTeamIndex
                                    ? " completed"
                                    : i === this.state.currentTeamIndex
                                      ? " active"
                                      : "")
                            }
                        />
                    ))}
                </div>

                <div
                    className={
                        "tallyTeamCard" +
                        (this.state.isTransitioning ? " slideOut" : " slideIn") +
                        (this.state.isTallyCompleted ? " scored" : "")
                    }
                    key={this.state.currentTeamIndex}
                >
                    <div className="tallyTeamName">{tallyTeam.name}</div>

                    <table className="tallyTeamTable">
                        <thead>
                            <tr>
                                <th>Player</th>
                                <th>Wager</th>
                                <th>Response</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tallyTeam.players.map((player: ITallyPlayer, index: number) => (
                                <tr key={index}>
                                    <td>{player.name}</td>
                                    <td>
                                        <div style={shouldRender() ? {} : { visibility: "hidden" }}>{player.wager}</div>
                                    </td>
                                    <td>
                                        <div style={shouldRender() ? {} : { visibility: "hidden" }}>
                                            {player.answer != null ? player.answer : "[BLANK]"}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="tallyAction">
                        {allRevealed && !this.state.showResult && !this.state.isTallyCompleted && (
                            <>
                                <button className="tallyCorrect" onClick={this.correctResponse}>
                                    ✓ Correct
                                </button>
                                <button className="tallyIncorrect" onClick={this.incorrectResponse}>
                                    ✗ Incorrect
                                </button>
                            </>
                        )}
                        {(this.state.showResult || this.state.isTallyCompleted) && (
                            <span className={tallyTeam.isCorrect ? "resultCorrect" : "resultIncorrect"}>
                                {tallyTeam.isCorrect ? "✓ Correct" : "✗ Incorrect"}
                            </span>
                        )}
                    </div>
                </div>

                <div className="postTally">
                    {!this.state.isTallyCompleted && !this.state.showResult && !allRevealed && (
                        <div className="categoryRevealHint">HIT SPACE TO REVEAL RESPONSES</div>
                    )}
                    {!this.state.isTallyCompleted && !this.state.showResult && allRevealed && (
                        <div className="categoryRevealHint">Press Z for Correct, X for Incorrect</div>
                    )}
                </div>
            </div>
        );
    }
}
