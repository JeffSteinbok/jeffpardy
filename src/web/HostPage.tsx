import * as React from "react";
import * as ReactDOM from "react-dom";
import { JeffpardyHostController, ICategory, IGameData } from "./JeffpardyHostController";
import { AppTitleBar } from "./components/appTitleBar/AppTitleBar";
import { JeffpardyBoard, IJeffpardyBoard } from "./components/gameBoard/JeffpardyBoard";
import { Scoreboard } from "./components/scoreboard/Scoreboard";
import { Logger } from "./utilities/Logger";
import { HostCheatSheet } from "./components/hostCheatSheet/HostCheatSheet";
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import { TextField } from "@material-ui/core";
import { Debug, DebugFlags } from "./utilities/Debug";

export enum HostPageViewMode {
    Start,
    Intro,
    Game,
    AnswerKey
}

export interface IHostPageProps {
}

export interface IHostPageState {
    viewMode: HostPageViewMode;
    round: number,
    categories: ICategory[];
    isCustomCategoryDialogOpen: boolean;
}

export interface IHostPage {
    setViewMode: (viewMode: HostPageViewMode) => void;
    startNewRound: () => void;
    onGameDataLoaded: (gameData: IGameData) => void;
    onUpdateTeams: (teams) => void;
}

/**
 * Root page for the host view, begins the rendering.
 */
export class HostPage extends React.Component<any, any> {

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
            isCustomCategoryDialogOpen: false
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

    public componentDidMount() {
        this.jeffpardyHostController.loadGameData();
    }

    public loadCustomCategories = () => {

        this.setState({ isCustomCategoryDialogOpen: false })
        this.jeffpardyHostController.setCustomGameData(JSON.parse(this.customCategoryJSON));
        alert("Please check the answer key to see if this loaded correctly.")
    }

    public showAnswerKey = () => {
        this.setState({
            viewMode: HostPageViewMode.AnswerKey
        });
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
        this.setState({
            viewMode: HostPageViewMode.Game,
            categories: this.state.gameData.rounds[0].categories
        });
    }

    public startNewRound = () => {
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

    public onUpdateTeams = (teams) => {
        Logger.debug("HostPage:onUpdateTeams", teams);
        this.setState({
            teams: teams
        });
    }

    public render() {
        Logger.debug("HostPage:render", this.state.gameData);

        return (
            <div>
                {
                    this.state.viewMode == HostPageViewMode.Start &&

                    <div id="hostStartPage">
                        <div className="title">Jeffpardy!</div>

                        { this.state.gameData == null &&
                            <div>Finding some really great clues...</div>
                        }
                        { this.state.gameData != null &&
                            <div>
                                <div className="gameCode">Use Game Code: { this.gameCode }</div>
                                Give the above game code to the players or give them this direct link:<br />
                                <a target="#" href={ "/player#" + this.gameCode }>https://{ window.location.hostname }{ window.location.port != "" ? ":" + window.location.port : "" }/player#{ this.gameCode }</a>
                                <p></p>
                                Don't forget to save or print the answer key before you start. <br />
                                If you don't, you won't be able to during the game.
                                <p></p>
                                <span style={ { color: "red" } }>NEW: Use your own categories!</span><br />
                                <button onClick={ () => { this.setState({ isCustomCategoryDialogOpen: true }) } }>Use Custom Categories</button>
                                <p></p>
                                <button onClick={ this.showAnswerKey }>Show Answers</button>
                                <p />
                                <button onClick={ this.startIntro }>Start Game!</button>
                                <Dialog
                                    open={ this.state.isCustomCategoryDialogOpen }
                                    keepMounted
                                    fullWidth
                                >
                                    <DialogTitle id="alert-dialog-slide-title">{ "Modify this JSON" }</DialogTitle>
                                    <DialogContent>
                                        <TextField id="alert-dialog-slide-description"
                                            style={ { fontSize: "0.8em", fontFamily: "Courier" } }
                                            fullWidth
                                            multiline
                                            defaultValue={ JSON.stringify(this.jeffpardyHostController.gameData, null, 4) }
                                            onChange={ (event) => this.customCategoryJSON = event.target.value } />
                                    </DialogContent>
                                    <DialogActions>
                                        <Button onClick={ () => { this.setState({ isCustomCategoryDialogOpen: false }) } }>
                                            Cancel
                                    </Button>
                                        <Button onClick={ this.loadCustomCategories } color="primary">
                                            Load
                                    </Button>
                                    </DialogActions>
                                </Dialog>
                            </div>
                        }
                    </div>
                }
                {
                    this.state.viewMode == HostPageViewMode.AnswerKey &&
                    <HostCheatSheet jeffpardyController={ this.jeffpardyHostController } gameData={ this.state.gameData } />
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
                                <JeffpardyBoard jeffpardyHostController={ this.jeffpardyHostController } categories={ this.state.categories } round={ this.state.round }></JeffpardyBoard>
                                <Scoreboard jeffpardyHostController={ this.jeffpardyHostController } teams={ this.state.teams }></Scoreboard>
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
