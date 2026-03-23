// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { createRoot } from "react-dom/client";
import "../../Jeffpardy.css";
import { JeffpardyHostController } from "./JeffpardyHostController";
import { JeffpardyBoard } from "./gameBoard/JeffpardyBoard";
import { Scoreboard } from "./scoreboard/Scoreboard";
import { Logger } from "../../utilities/Logger";
import { Debug, DebugFlags } from "../../utilities/Debug";
import { HostStartScreen } from "./hostStartScreen/HostStartScreen";
import { HostLobby } from "./HostLobby";
import * as QRCode from "qrcode.react";
import { IGameData, FinalJeffpardyAnswerDictionary, FinalJeffpardyWagerDictionary } from "./Types";
import { ICategory, ITeam, TeamDictionary } from "../../Types";
import { ScreenSizeWarning } from "../../components/screenSizeWarning/ScreenSizeWarning";

export enum HostPageViewMode {
    Start,
    Lobby,
    Intro,
    Game,
    End,
}

export type IHostPageProps = Record<string, never>;

export interface IHostPageState {
    viewMode: HostPageViewMode;
    round: number;
    categories: ICategory[];
    controllingTeam: ITeam;
    teams: TeamDictionary;
    gameData: IGameData;
    finalJeffpardyWagers: FinalJeffpardyWagerDictionary;
    finalJeffpardyAnswers: FinalJeffpardyAnswerDictionary;
    isQrDrawerOpen: boolean;
}

export interface IHostPage {
    setViewMode: (viewMode: HostPageViewMode) => void;
    startNewRound: () => void;
    startIntermission: () => void;
    startFinalJeffpardy: () => void;
    onGameDataLoaded: (gameData: IGameData) => void;
    onUpdateTeams: (teams: TeamDictionary) => void;
    onUpdateFinalJeffpardy: (wagers: FinalJeffpardyWagerDictionary, answers: FinalJeffpardyAnswerDictionary) => void;
    onControllingTeamChange: (team: ITeam) => void;
}

/**
 * Root page for the host view, begins the rendering.
 */
export class HostPage extends React.Component<IHostPageProps, IHostPageState> {
    jeffpardyHostController: JeffpardyHostController;
    gameCode: string;
    hostCode: string;
    customCategoryJSON: string;

    constructor(props: IHostPageProps) {
        super(props);

        // Set Debug Flags
        // TODO:  Base Class
        const urlParams = new URLSearchParams(window.location.search);
        const debugParam: string = urlParams.get("debugMode");
        Debug.SetFlags(Number.parseInt(debugParam, 16));

        if (!Debug.IsFlagSet(DebugFlags.FixedGameCode)) {
            this.gameCode = this.makeGameCode();
            this.hostCode = this.makeGameCode();
        } else {
            this.gameCode = "AAAAAA";
            this.hostCode = "BBBBBB";
        }

        this.jeffpardyHostController = new JeffpardyHostController(this.gameCode, this.hostCode);
        this.jeffpardyHostController.hostPage = this;

        this.state = {
            viewMode: HostPageViewMode.Start,
            round: 0,
            categories: null,
            controllingTeam: null,
            teams: {},
            gameData: null,
            finalJeffpardyWagers: {},
            finalJeffpardyAnswers: {},
            isQrDrawerOpen: false,
        };
    }

    private makeGameCode(): string {
        const length: number = 6;
        let result = "";
        const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    private getRandomTeam(teams: TeamDictionary): ITeam {
        const teamNameArray: string[] = [];

        for (const teamName in teams) {
            if (Object.prototype.hasOwnProperty.call(teams, teamName)) {
                teamNameArray.push(teamName);
            }
        }

        if (teamNameArray.length === 0) return null; // or whatever default return you want for an empty object

        // return the actual value associated with the key:
        return teams[teamNameArray[Math.floor(Math.random() * teamNameArray.length)]];
    }

    private getLowestScoringTeam(teams: TeamDictionary): ITeam {
        let lowestScore: number = Number.MAX_SAFE_INTEGER;
        let lowestScoreKeyArray: string[] = [];

        for (const teamName in teams) {
            if (Object.prototype.hasOwnProperty.call(teams, teamName)) {
                const team: ITeam = teams[teamName];

                if (team.score < lowestScore) {
                    lowestScoreKeyArray = [teamName];
                    lowestScore = team.score;
                } else if (team.score == lowestScore) {
                    lowestScoreKeyArray.push(teamName);
                }
            }
        }

        if (lowestScoreKeyArray.length === 0) return null; // or whatever default return you want for an empty object

        // return the actual value associated with the key:
        return teams[lowestScoreKeyArray[Math.floor(Math.random() * lowestScoreKeyArray.length)]];
    }

    public componentDidMount() {
        this.jeffpardyHostController.loadGameData();
    }

    public startIntro = () => {
        if (Debug.IsFlagSet(DebugFlags.SkipIntro)) {
            this.startGame();
            return;
        }
        this.setState({
            viewMode: HostPageViewMode.Intro,
        });
    };

    public startGame = () => {
        this.jeffpardyHostController.controllingTeamChange(this.getRandomTeam(this.state.teams));

        if (Debug.IsFlagSet(DebugFlags.FinalJeffpardy)) {
            this.setState({
                viewMode: HostPageViewMode.Game,
                round: 1,
                categories: [this.state.gameData.finalJeffpardyCategory],
                controllingTeam: null,
            });
        } else {
            this.setState({
                viewMode: HostPageViewMode.Game,
                categories: this.state.gameData.rounds[0].categories,
            });
        }

        this.jeffpardyHostController.startRound(this.state.gameData.rounds[0]);
    };

    public startNewRound = () => {
        this.jeffpardyHostController.controllingTeamChange(this.getLowestScoringTeam(this.state.teams));
        this.jeffpardyHostController.scoreboard.clearControl();

        this.setState({
            round: this.state.round + 1,
            categories: this.state.gameData.rounds[this.state.round + 1].categories,
        });

        this.jeffpardyHostController.startRound(this.state.gameData.rounds[this.state.round + 1]);
    };

    public startIntermission = () => {};

    public startFinalJeffpardy = () => {
        this.setState({
            round: this.state.round + 1,
            categories: [this.state.gameData.finalJeffpardyCategory],
        });

        this.jeffpardyHostController.startRound({
            id: 2,
            name: "Final Jeffpardy",
            categories: [this.state.gameData.finalJeffpardyCategory],
        });
    };

    public setViewMode = (viewMode: HostPageViewMode) => {
        this.setState({
            viewMode: viewMode,
        });
    };

    public onGameDataLoaded = (gameData: IGameData) => {
        Logger.debug("HostPage:onGameDataLoaded", gameData);
        this.setState({
            gameData: gameData,
            categories: gameData.rounds[0].categories,
        });
    };

    public onUpdateTeams = (teams: TeamDictionary) => {
        Logger.debug("HostPage:onUpdateTeams", teams);

        this.setState({
            teams: teams,
        });
    };

    public onUpdateFinalJeffpardy = (
        wagers: FinalJeffpardyWagerDictionary,
        answers: FinalJeffpardyAnswerDictionary
    ) => {
        Logger.debug("HostPage:onUpdateFinalJeffpardy", wagers, answers);

        this.setState({
            finalJeffpardyWagers: wagers,
            finalJeffpardyAnswers: answers,
        });
    };

    public onControllingTeamChange = (team: ITeam) => {
        Logger.debug("HostPage:onControllingTeamChange", team);
        this.setState({
            controllingTeam: team,
        });
    };

    onScoreChange = (team: ITeam, newScore: number) => {
        Logger.debug("HostPage:onScoreChange", team, newScore);
        team.score = newScore;
        this.setState({
            teams: this.state.teams,
        });
    };

    public render() {
        Logger.debug("HostPage:render", this.state.gameData);

        return (
            <div>
                <ScreenSizeWarning minWidth={1250} minHeight={750} />
                {this.state.viewMode == HostPageViewMode.Start && (
                    <HostStartScreen
                        gameCode={this.gameCode}
                        hostCode={this.hostCode}
                        gameData={this.state.gameData}
                        teams={this.state.teams}
                        onModifyGameData={(gameData) => {
                            this.jeffpardyHostController.setCustomGameData(gameData);
                        }}
                        jeffpardyHostController={this.jeffpardyHostController}
                        onEnterLobby={() => {
                            this.setState({
                                viewMode: HostPageViewMode.Lobby,
                            });
                        }}
                    />
                )}
                {this.state.viewMode == HostPageViewMode.Lobby && (
                    <HostLobby teams={this.state.teams} gameCode={this.gameCode} onStartGame={this.startIntro} />
                )}
                {this.state.viewMode == HostPageViewMode.Intro && (
                    <div id="introVideo">
                        <video autoPlay onEnded={this.startGame}>
                            <source src="/IntroVideo.mp4" type="video/mp4" />
                        </video>
                    </div>
                )}
                {(this.state.viewMode == HostPageViewMode.Game || this.state.viewMode == HostPageViewMode.End) && (
                    <div className="topPageNormal">
                        <div className="topSection jeffpardy-label">
                            <img src="/images/JeffpardyTitle.png" className="title" />
                            <div className="gameCode">Game Code: {this.gameCode}</div>
                        </div>
                        <div className="middleSection">
                            <div id="pageContent" className="pageContent">
                                <JeffpardyBoard
                                    jeffpardyHostController={this.jeffpardyHostController}
                                    categories={this.state.categories}
                                    round={this.state.round}
                                    controllingTeam={this.state.controllingTeam}
                                    teams={this.state.teams}
                                    finalJeffpardyWagers={this.state.finalJeffpardyWagers}
                                    finalJeffpardyAnswers={this.state.finalJeffpardyAnswers}
                                    onScoreChange={this.onScoreChange}
                                />
                                <Scoreboard
                                    jeffpardyHostController={this.jeffpardyHostController}
                                    teams={this.state.teams}
                                    controllingTeam={this.state.controllingTeam}
                                    hilightWinningTeams={this.state.viewMode == HostPageViewMode.End}
                                    hostSecondaryWindowUri={
                                        "https://" +
                                        window.location.hostname +
                                        (window.location.port != "" ? ":" + window.location.port : "") +
                                        "/hostSecondary#" +
                                        this.gameCode +
                                        this.hostCode
                                    }
                                />
                            </div>
                            <div className={"qrDrawer" + (this.state.isQrDrawerOpen ? " open" : "")}>
                                <button
                                    className="qrDrawerToggle jeffpardy-label"
                                    onClick={() => this.setState({ isQrDrawerOpen: !this.state.isQrDrawerOpen })}
                                >
                                    {this.state.isQrDrawerOpen ? "▼" : "▲ Join"}
                                </button>
                                <div className="qrDrawerContent">
                                    <QRCode.QRCodeCanvas
                                        value={
                                            "https://" +
                                            window.location.hostname +
                                            (window.location.port != "" ? ":" + window.location.port : "") +
                                            "/player#" +
                                            this.gameCode
                                        }
                                        size={120}
                                        includeMargin={true}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

// Start the application
const root = document.createElement("div");
root.id = "main";
document.body.appendChild(root);
const reactRoot = createRoot(root);
reactRoot.render(<HostPage />);
