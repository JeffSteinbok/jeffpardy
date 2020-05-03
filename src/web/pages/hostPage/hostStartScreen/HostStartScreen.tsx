import * as React from "react";
import * as ReactDOM from "react-dom";
import { IGameRound, ICategory, IClue, IGameData } from "../Types";
import { Logger } from "../../../utilities/Logger";
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import { TextField } from "@material-ui/core";
import { AnswerKey } from "./AnswerKey";
import { TeamDictionary } from "../../../Types";

export enum HostStartScreenViewMode {
    Normal,
    AnswerKey
}


export interface IHostStartScreenProps {
    gameCode: string;
    gameData: IGameData;
    teams: TeamDictionary;
    onModifyGameData: (gameData: IGameData) => void;
    onEnterLobby: () => void;
}

export interface IHostStartScreenState {
    viewMode: HostStartScreenViewMode;
    isCustomCategoryDialogOpen: boolean;
}

/**
 * Root page for the host view, begins the rendering.
 */
export class HostStartScreen extends React.Component<IHostStartScreenProps, IHostStartScreenState> {

    customCategoryJSON: string;
    isCustomCategoryDialogOpen: boolean = false;

    constructor(props: any) {
        super(props);

        this.state = {
            viewMode: HostStartScreenViewMode.Normal,
            isCustomCategoryDialogOpen: false
        }
    }

    public loadCustomCategories = () => {

        this.setState({ isCustomCategoryDialogOpen: false })
        this.props.onModifyGameData(JSON.parse(this.customCategoryJSON));
        alert("Please check the answer key to see if this loaded correctly.")
    }

    public showAnswerKey = () => {
        this.setState({
            viewMode: HostStartScreenViewMode.AnswerKey
        });
    }

    public hideAnswerKey = () => {
        this.setState({
            viewMode: HostStartScreenViewMode.Normal
        });
    }


    public startGame = () => {
        this.props.onEnterLobby();
    }

    public render() {
        Logger.debug("HostStartScreen:render", this.props.gameData);

        let finalCategory: ICategory;
        let finalAirDate: Date;

        if (this.props.gameData != null) {
            finalCategory = this.props.gameData.finalJeffpardyCategory;
            finalAirDate = new Date(finalCategory.airDate);
        }

        return (
            <div>
                {
                    this.state.viewMode == HostStartScreenViewMode.Normal &&

                    <div className="hostStartPage">
                        <div className="title">Jeffpardy!</div>

                        { this.props.gameData == null &&
                            <div>Finding some really great clues...</div>
                        }
                        { this.props.gameData != null &&
                            <div>
                                <div className="gameCode">Use Game Code: { this.props.gameCode }</div>
                                    Give the above game code to the players or give them this direct link:<br />
                                <a target="#" href={ "/player#" + this.props.gameCode }>https://{ window.location.hostname }{ window.location.port != "" ? ":" + window.location.port : "" }/player#{ this.props.gameCode }</a>
                                <p></p>
                                    Don't forget to save or print the answer key before you start. <br />
                                    If you don't, you won't be able to during the game.
                                <p></p>

                                <ul className="categoryList">
                                    {
                                        this.props.gameData.rounds.map((round, index) => {
                                            return (
                                                <li key={ index }>{ round.name }
                                                    <ul>
                                                        {
                                                            round.categories.map((category, index) => {
                                                                let airDate: Date = new Date(category.airDate);
                                                                return (
                                                                    <li key={ index }> { category.title } - { airDate.getMonth() + 1 + "/" + airDate.getDay() + "/" + airDate.getFullYear() }</li>
                                                                )
                                                            })
                                                        }
                                                    </ul>
                                                </li>
                                            )
                                        })
                                    }
                                </ul>
                                <ul className="categoryList" style={ { columns: 1 } }>
                                    <li>Final Jeffpardy
                                        <ul>
                                            <li> { finalCategory.title } - { finalAirDate.getMonth() + 1 + "/" + finalAirDate.getDay() + "/" + finalAirDate.getFullYear() }</li>
                                        </ul>
                                    </li>

                                </ul>

                                <span style={ { color: "red" } }>NEW: Edit these categories and clues.</span><br />
                                <div><a href="/fromJeopardyLabs">Pull some game data from JeopardyLabs</a></div>
                                <button onClick={ () => { this.setState({ isCustomCategoryDialogOpen: true }) } }>Edit Categories &amp; Clues</button>
                                <p></p>
                                <button onClick={ this.showAnswerKey }>Show Answers</button>
                                <p />

                                <button onClick={ this.props.onEnterLobby }>Enter Game Lobby</button>

                                <Dialog
                                    open={ this.state.isCustomCategoryDialogOpen }
                                    keepMounted
                                    fullWidth
                                    maxWidth={ false }
                                >
                                    <DialogTitle id="alert-dialog-slide-title">{ "Modify this JSON" }</DialogTitle>
                                    <DialogContent>
                                        <TextField id="alert-dialog-slide-description"
                                            style={ { fontSize: "0.8em", fontFamily: "Courier" } }
                                            fullWidth
                                            multiline
                                            defaultValue={ JSON.stringify(this.props.gameData, null, 4) }
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
                    this.state.viewMode == HostStartScreenViewMode.AnswerKey &&
                    <AnswerKey
                        gameData={ this.props.gameData }
                        onHide={ this.hideAnswerKey } />
                }
            </div>
        );
    }
}
