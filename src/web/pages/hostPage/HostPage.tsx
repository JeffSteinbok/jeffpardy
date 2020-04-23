import * as React from "react";
import * as ReactDOM from "react-dom";
import { JeffpardyHostController } from "./JeffpardyHostController";
import { JeffpardyBoard } from "./gameBoard/JeffpardyBoard";
import { Scoreboard } from "./scoreboard/Scoreboard";
import { Logger } from "../../utilities/Logger";
import { Debug, DebugFlags } from "../../utilities/Debug";
import { HostStartScreen } from "./hostStartScreen/HostStartScreen";
import { PlayerList } from "../../components/playerList/PlayerList";
import { HostLobby } from "./HostLobby";
import { ICategory, IGameData } from "./Types";
import { ITeam, TeamDictionary } from "../../Types";

export enum HostPageViewMode {
    Start,
    Lobby,
    Intro,
    Game,
}

export interface IHostPageProps {
}

export interface IHostPageState {
    viewMode: HostPageViewMode;
    round: number,
    categories: ICategory[];
    controllingTeam: ITeam;
    teams: TeamDictionary;
    gameData: IGameData;
}

export interface IHostPage {
    setViewMode: (viewMode: HostPageViewMode) => void;
    startNewRound: () => void;
    onGameDataLoaded: (gameData: IGameData) => void;
    onUpdateTeams: (teams) => void;
    onControllingTeamChange: (team: ITeam) => void;
}

/**
 * Root page for the host view, begins the rendering.
 */
export class HostPage extends React.Component<IHostPageProps, IHostPageState> {

    jeffpardyHostController: JeffpardyHostController;
    gameCode: string;
    customCategoryJSON: string;

    constructor(props: any) {
        super(props);

        // Set Debug Flags
        // TODO:  Base Class
        const urlParams = new URLSearchParams(window.location.search);
        const debugParam: string = urlParams.get('debugMode');
        Debug.SetFlags(Number.parseInt(debugParam, 16));

        if (!Debug.IsFlagSet(DebugFlags.FixedGameCode)) {
            this.gameCode = this.makeGameCode();
        } else {
            this.gameCode = "AAAAAA";
        }

        this.jeffpardyHostController = new JeffpardyHostController(this.gameCode);
        this.jeffpardyHostController.hostPage = this;

        this.state = {
            viewMode: HostPageViewMode.Start,
            round: 0,
            categories: null,
            controllingTeam: null,
            teams: {},
            gameData: null
        }
    }

    private makeGameCode(): string {
        let length: number = 6;
        var result = '';
        var characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    private getRandomTeam(teams: { [key: string]: ITeam }): ITeam {
        let teamKeyArray: string[] = [];
        let teamKey: string;

        for (teamKey in teams) {
            if (teams.hasOwnProperty(teamKey)) {
                teamKeyArray.push(teamKey);
            }
        }

        if (teamKeyArray.length === 0)
            return null; // or whatever default return you want for an empty object

        // return the actual value associated with the key:
        return teams[teamKeyArray[Math.floor(Math.random() * teamKeyArray.length)]];
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
    }

    public startGame = () => {

        // TODO:  Set this randomly.
        this.jeffpardyHostController.controllingTeamChange(this.getRandomTeam(this.state.teams));

        this.setState({
            viewMode: HostPageViewMode.Game,
            categories: this.state.gameData.rounds[0].categories
        });
    }

    public startNewRound = () => {

        // TODO:  Set this to the lowest score...

        this.setState({
            round: this.state.round + 1,
            categories: this.state.gameData.rounds[this.state.round + 1].categories
        })
    }

    public setViewMode = (viewMode: HostPageViewMode) => {
        this.setState({
            viewMode: viewMode
        })
    };

    public onGameDataLoaded = (gameData: IGameData) => {
        Logger.debug("HostPage:onGameDataLoaded", gameData);
        this.setState({
            gameData: gameData,
            categories: gameData.rounds[0].categories
        })
    }

    public onUpdateTeams = (teams: { [key: string]: ITeam }) => {
        Logger.debug("HostPage:onUpdateTeams", teams);

        this.setState({
            teams: teams,
        });
    }

    public onControllingTeamChange = (team: ITeam) => {
        Logger.debug("HostPage:onControllingTeamChange", team);
        this.setState({
            controllingTeam: team
        });
    }

    public render() {
        Logger.debug("HostPage:render", this.state.gameData);

        return (
            <div>
                {
                    this.state.viewMode == HostPageViewMode.Start &&
                    <HostStartScreen
                        gameCode={ this.gameCode }
                        gameData={ this.state.gameData }
                        teams={ this.state.teams }
                        onModifyGameData={ (gameData) => { this.jeffpardyHostController.setCustomGameData(gameData) } }
                        onEnterLobby={ () => {
                            this.setState({
                                viewMode: HostPageViewMode.Lobby
                            })
                        } } />
                }
                {
                    this.state.viewMode == HostPageViewMode.Lobby &&
                    <HostLobby
                        teams={ this.state.teams }
                        gameCode={ this.gameCode }
                        onStartGame={ this.startIntro } />
                }
                {
                    this.state.viewMode == HostPageViewMode.Intro &&
                    <div id="introVideo">
                        <video autoPlay onEnded={ this.startGame }>
                            <source src="/IntroVideo.mp4" type="video/mp4" />
                        </video>
                    </div>
                }
                {
                    this.state.viewMode == HostPageViewMode.Game &&
                    <div className="topPageNormal" >
                        <div className="topSection">
                            <div className="title">Jeffpardy!</div>
                            <div className="gameCode">Use game code: { this.gameCode }</div>
                        </div>
                        <div className="middleSection">
                            <div id="pageContent" className="pageContent">
                                <JeffpardyBoard
                                    jeffpardyHostController={ this.jeffpardyHostController }
                                    categories={ this.state.categories }
                                    round={ this.state.round }
                                    controllingTeam={ this.state.controllingTeam } />
                                <Scoreboard
                                    jeffpardyHostController={ this.jeffpardyHostController }
                                    teams={ this.state.teams }
                                    controllingTeam={ this.state.controllingTeam } />
                            </div>
                        </div>
                    </div>
                }
            </div >
        );
    }
}


// Start the application
let root = document.createElement("div");
root.id = 'main';
document.body.appendChild(root);
ReactDOM.render(
    <HostPage />,
    document.getElementById("main")
);
