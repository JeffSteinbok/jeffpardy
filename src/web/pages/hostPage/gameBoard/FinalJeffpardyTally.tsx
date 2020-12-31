import * as React from "react";
import { IPlayer, TeamDictionary, ITeam } from "../../../Types";
import { Logger } from "../../../utilities/Logger";
import { FinalJeffpardySubmissionDictionary, FinalJeffpardyAnswerDictionary, FinalJeffpardyWagerDictionary } from "../Types";
import { IClue } from "../../../Types";
import { SpecialKey } from "../../../utilities/Key";
import { stringify } from "querystring";

export interface IFinalJeffpardyTallyProps {
    teams: TeamDictionary,
    wagers: FinalJeffpardyWagerDictionary,
    answers: FinalJeffpardyAnswerDictionary
    onScoreChange: (team: ITeam, newScore: number) => void,
    onTallyCompleted: () => void

}

export interface IFinalJeffpardyTallyState {
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

export class FinalJeffpardyTally extends React.Component<IFinalJeffpardyTallyProps, any> {

    tallyTeams: ITallyTeam[] = [];
    isRevealBlocked: boolean = false;

    constructor(props: any) {
        super(props);

        Logger.debug("FinalJeffpardyTally:constructor", this.props.teams);


        // Need to restructure the data to make it easier to render, and don't want to have
        // to re-compute it at render.
        // Teams have to go in order of current score, lowest to highest.
        // Answers have to go in order of wager, lowest to highest; with ties going to quickest.


        for (var key in this.props.teams) {
            if (this.props.teams.hasOwnProperty(key)) {
                let team: ITeam = this.props.teams[key];

                let tallyTeam: ITallyTeam = {
                    name: team.name,
                    score: team.score,
                    players: [],
                    isCorrect: false
                }

                team.players.forEach((player: IPlayer) => {
                    if (player.connectionId in this.props.wagers) {
                        let tallyPlayer: ITallyPlayer = {
                            name: player.name,
                            wager: this.props.wagers[player.connectionId],
                            answer: player.connectionId in this.props.answers ? this.props.answers[player.connectionId].answer : null,
                            responseTime: player.connectionId in this.props.answers ? this.props.answers[player.connectionId].responseTime : 0,
                        }

                        tallyTeam.players.push(tallyPlayer);
                    }
                })
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
                })
                this.tallyTeams.push(tallyTeam);
            }

            this.tallyTeams.sort((a: ITallyTeam, b: ITallyTeam): number => {
                return a.score - b.score;
            })
        }

        this.state = {
            revealStep: 0,
            currentTeamIndex: 0,
            isTallyCompleted: this.tallyTeams.length > 0 ? false : true
        }
    }

    handleKeyDown = (event: KeyboardEvent) => {
        switch (event.keyCode) {
            case SpecialKey.SPACE:
                Logger.debug("FinalJeffpardyTally:handleKeyDown", this.state.revealStep + 1);
                this.setState({
                    revealStep: this.state.revealStep + 1
                })
                break;
        }
    }

    componentDidMount = () => {
        window.addEventListener("keydown", this.handleKeyDown)
    }

    componentWillUnmount() {
        window.removeEventListener("keydown", this.handleKeyDown);
    }

    correctResponse = () => {
        this.processResponse(true);
    }

    incorrectResponse = () => {
        this.processResponse(false);
    }

    processResponse = (isCorrect: boolean) => {

        let tallyTeam: ITallyTeam = this.tallyTeams[this.state.currentTeamIndex];
        let maxWager: number = 0;
        if (tallyTeam.players.length > 0) {
            maxWager = tallyTeam.players[tallyTeam.players.length - 1].wager;
        }
        let teamObject: ITeam = this.props.teams[tallyTeam.name];
        tallyTeam.isCorrect = isCorrect;

        let adjustment: number = maxWager;
        if (!isCorrect) {
            adjustment *= -1;
        }

        this.props.onScoreChange(teamObject, teamObject.score + adjustment);

        let newTeamIndex: number = this.state.currentTeamIndex + 1;

        if (newTeamIndex >= this.tallyTeams.length) {
            this.setState({
                isTallyCompleted: true
            })
            this.props.onTallyCompleted();
        }
        this.setState({
            currentTeamIndex: newTeamIndex,
            revealStep: 0
        })
    }

    public render() {
        Logger.debug("FinalJeffpardyTally:render", this.props.teams);

        let revealCurrStep: number = 0;
        let visibleStyle = {};
        let hiddenStyle = { visibility: "hidden" };

        return (
            <div>
                <ul className="FinalJeffpardyTally">
                    {
                        this.tallyTeams.map((tallyTeam: ITallyTeam, index: number) => {

                            let shouldRender = (): boolean => {
                                if (this.state.currentTeamIndex > index) {
                                    return true;
                                } else if (this.state.currentTeamIndex == index) {
                                    return ++revealCurrStep <= this.state.revealStep;
                                } else if (this.state.currentTeamIndex > index) {
                                    return false;
                                }
                            }

                            return (
                                <li key={ index }>Team: { tallyTeam.name }
                                    { this.state.currentTeamIndex >= index &&
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th className="player">Player</th>
                                                    <th className="wager">Wager</th>
                                                    <th className="response">Response</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    tallyTeam.players.map((player: ITallyPlayer, index: number) => {
                                                        return (
                                                            <tr key={ index }>
                                                                <td>{ player.name }</td>
                                                                <td><div style={ shouldRender() ? visibleStyle : hiddenStyle }>
                                                                    { player.wager }
                                                                </div></td>
                                                                <td>
                                                                    <div style={ shouldRender() ? visibleStyle : hiddenStyle }>
                                                                        { player.answer != null ? player.answer : "[BLANK]" }
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })
                                                }
                                            </tbody>
                                        </table>
                                    }
                                    { this.state.currentTeamIndex == index &&
                                        this.state.revealStep >= tallyTeam.players.length * 2 &&
                                        <div>
                                            <button onClick={ this.correctResponse }>Right</button>
                                            <button onClick={ this.incorrectResponse }>Wrong</button>
                                        </div>
                                    }
                                    { this.state.currentTeamIndex > index &&
                                        <div>{ tallyTeam.isCorrect ? "Right" : "Wrong" }</div>
                                    }
                                </li>
                            )
                        })
                    }
                </ul>
                <div className="postTally">
                    { !this.state.isTallyCompleted &&
                        <i>Hit SPACE to reveal responses</i>
                    }
                    { this.state.isTallyCompleted &&
                        <div>Thank you for playing.  Refresh your browser to start a new game.</div>
                    }
                </div>
            </div>
        );
    }
}
