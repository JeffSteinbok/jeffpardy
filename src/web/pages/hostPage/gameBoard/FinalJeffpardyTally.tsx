import * as React from "react";
import { IPlayer, TeamDictionary, ITeam } from "../../../Types";
import { Logger } from "../../../utilities/Logger";
import { FinalJeffpardyAnswerDictionary, FinalJeffpardyWagerDictionary } from "../Types";
import { SpecialKey } from "../../../utilities/Key";

export interface IFinalJeffpardyTallyProps {
    teams: TeamDictionary;
    wagers: FinalJeffpardyWagerDictionary;
    answers: FinalJeffpardyAnswerDictionary;
    onScoreChange: (team: ITeam, newScore: number) => void;
    onTallyCompleted: () => void;
}

export interface IFinalJeffpardyTallyState {
    // revealStep: incremented by Space key; each press reveals one cell (wager or answer)
    // in the current team's player table. Reset to 0 when moving to the next team.
    revealStep: number;
    currentTeamIndex: number;
    isTallyCompleted: boolean;
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

export class FinalJeffpardyTally extends React.Component<IFinalJeffpardyTallyProps, IFinalJeffpardyTallyState> {
    tallyTeams: ITallyTeam[] = [];
    isRevealBlocked: boolean = false;

    constructor(props: IFinalJeffpardyTallyProps) {
        super(props);

        Logger.debug("FinalJeffpardyTally:constructor", this.props.teams);

        // Need to restructure the data to make it easier to render, and don't want to have
        // to re-compute it at render.
        // Teams have to go in order of current score, lowest to highest.
        // Answers have to go in order of wager, lowest to highest; with ties going to quickest.

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
                    if (a.wager < b.wager) {
                        return -1;
                    } else if (a.wager > b.wager) {
                        return 1;
                    } else {
                        if (a.responseTime > b.responseTime) {
                            return -1;
                        } else {
                            // In the case of absolute not worrying about it. Effectively random.
                            return 1;
                        }
                    }
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
            isTallyCompleted: this.tallyTeams.length > 0 ? false : true,
        };
    }

    handleKeyDown = (event: KeyboardEvent) => {
        switch (event.keyCode) {
            case SpecialKey.SPACE:
                Logger.debug("FinalJeffpardyTally:handleKeyDown", this.state.revealStep + 1);
                this.setState({
                    revealStep: this.state.revealStep + 1,
                });
                break;
            case 90: // Z = mark current team's response correct
                this.correctResponse();
                break;
            case 88: // X = mark current team's response incorrect
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
        const tallyTeam: ITallyTeam = this.tallyTeams[this.state.currentTeamIndex];
        // Team score is adjusted by the highest individual wager on the team (players are sorted by wager asc)
        let maxWager: number = 0;
        if (tallyTeam.players.length > 0) {
            maxWager = tallyTeam.players[tallyTeam.players.length - 1].wager;
        }
        const teamObject: ITeam = this.props.teams[tallyTeam.name];
        tallyTeam.isCorrect = isCorrect;

        let adjustment: number = maxWager;
        if (!isCorrect) {
            adjustment *= -1;
        }

        this.props.onScoreChange(teamObject, teamObject.score + adjustment);

        const newTeamIndex: number = this.state.currentTeamIndex + 1;

        if (newTeamIndex >= this.tallyTeams.length) {
            this.setState({
                isTallyCompleted: true,
            });
            this.props.onTallyCompleted();
        }
        this.setState({
            currentTeamIndex: newTeamIndex,
            revealStep: 0,
        });
    };

    public render() {
        Logger.debug("FinalJeffpardyTally:render", this.props.teams);

        // Counter reset per team during render; shouldRender() increments it so each
        // wager and answer cell maps to a sequential Space-press step.
        let revealCurrStep: number = 0;
        // Tables are always in the DOM (for stable layout) but individual cells use
        // visibility:hidden until their reveal step is reached.
        const visibleStyle = {};
        const hiddenStyle = { visibility: "hidden" };

        return (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                <ul className="finalJeffpardyTally">
                    {this.tallyTeams.map((tallyTeam: ITallyTeam, index: number) => {
                        // Returns true if this cell should be visible. Past teams always show;
                        // current team reveals cells one-by-one via revealStep; future teams are hidden.
                        const shouldRender = (): boolean => {
                            if (this.state.currentTeamIndex > index) {
                                return true;
                            } else if (this.state.currentTeamIndex == index) {
                                return ++revealCurrStep <= this.state.revealStep;
                            } else {
                                return false;
                            }
                        };

                        return (
                            <li key={index}>
                                Team: {tallyTeam.name}
                                <table style={this.state.currentTeamIndex >= index ? {} : { visibility: "hidden" }}>
                                    <thead>
                                        <tr>
                                            <th className="player">Player</th>
                                            <th className="wager">Wager</th>
                                            <th className="response">Response</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tallyTeam.players.map((player: ITallyPlayer, index: number) => {
                                            return (
                                                <tr key={index}>
                                                    <td>{player.name}</td>
                                                    <td>
                                                        <div style={shouldRender() ? visibleStyle : hiddenStyle}>
                                                            {player.wager}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={shouldRender() ? visibleStyle : hiddenStyle}>
                                                            {player.answer != null ? player.answer : "[BLANK]"}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <div className="tallyAction">
                                    {/* Show correct/incorrect buttons only after all cells revealed (2 per player: wager + answer) */}
                                    {this.state.currentTeamIndex == index &&
                                        this.state.revealStep >= tallyTeam.players.length * 2 && (
                                            <>
                                                <button onClick={this.correctResponse} style={{ color: "#4caf50" }}>
                                                    ✓
                                                </button>
                                                <button onClick={this.incorrectResponse} style={{ color: "#f44336" }}>
                                                    ✗
                                                </button>
                                            </>
                                        )}
                                    {this.state.currentTeamIndex > index && (
                                        <span>
                                            {tallyTeam.isCorrect ? (
                                                <span style={{ color: "#4caf50" }}>✓</span>
                                            ) : (
                                                <span style={{ color: "#f44336" }}>✗</span>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
                <div className="postTally">
                    {!this.state.isTallyCompleted && (
                        <div className="categoryRevealHint">Hit Space to Reveal Responses</div>
                    )}
                    {this.state.isTallyCompleted && (
                        <div className="categoryRevealHint">
                            Thank you for playing. Refresh your browser to start a new game.
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
