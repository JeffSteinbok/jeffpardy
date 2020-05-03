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

    public loadCustomCategoriesFromExcelPaste = () => {
        this.setState({ isCustomCategoryDialogOpen: false })

        // TODO: fix name
        let tsv: string = this.customCategoryJSON;

        let lines: string[] = tsv.split("\n");

        let gameData: IGameData = {
            rounds: [],
            finalJeffpardyCategory: null
        }

        // Totally hardcoding this.  Any failure will fail all
        let finalJeffpardyLineStart: number = 13;

        gameData.rounds.push({
            id: 0,
            name: "Jeffpardy",
            categories: this.parseRoundFromTsv(lines, 0)
        });

        if (lines[13].startsWith("Round 2")) {
            gameData.rounds.push({
                id: 1,
                name: "Super Jeffpardy",
                categories: this.parseRoundFromTsv(lines, 13)
            });
            finalJeffpardyLineStart = 26;
        }

        gameData.finalJeffpardyCategory = {
            title: lines[finalJeffpardyLineStart + 1],
            comment: '',
            airDate: "1900-01-21T00:11:00",
            hasDailyDouble: false,
            isAsked: false,
            clues: [
                {
                    clue: lines[finalJeffpardyLineStart + 2],
                    question: lines[finalJeffpardyLineStart + 3],
                    isDailyDouble: false,
                    isAsked: false,
                    value: 0
                }
            ]
        }

        this.props.onModifyGameData(gameData);
        alert("Please check the answer key to see if this loaded correctly.")
    }

    parseRoundFromTsv = (lines: string[], startLineIndex: number): ICategory[] => {
        let categories: ICategory[] = [];

        lines[startLineIndex + 1].split("\t").forEach((value, index) => {
            let category: ICategory = {
                title: value,
                clues: [],
                comment: '',
                airDate: "1900-01-21T00:11:00",
                hasDailyDouble: false,
                isAsked: false
            }
            categories.push(category);
        });

        for (let i: number = 0; i < 5; i++) {

            let clues: string[] = lines[startLineIndex + 2 + (i * 2)].split("\t");
            let questions: string[] = lines[startLineIndex + 2 + (i * 2) + 1].split("\t");

            for (let j: number = 0; j < 6; j++) {
                categories[j].clues.push({
                    clue: clues[j],
                    question: questions[j],
                    isAsked: false,
                    isDailyDouble: false,
                    value: 0
                });
            }
        }

        return categories;
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
                                <div><a href="/JeffpardyGameDataTemplate.xlsx" target="#">Download Excel Template</a></div>
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
                                            defaultValue={
                                                JSON.stringify(this.props.gameData, (key, value) => {
                                                    if (key == "isAsked") return undefined;
                                                    else if (key == "isDailyDouble") return undefined;
                                                    else if (key == "hasDailyDouble") return undefined;
                                                    else if (key == "value") return undefined;
                                                    else return value;
                                                }, 4)
                                            }
                                            onChange={ (event) => this.customCategoryJSON = event.target.value } />
                                    </DialogContent>
                                    <DialogActions>
                                        <Button onClick={ () => { this.setState({ isCustomCategoryDialogOpen: false }) } }>
                                            Cancel
                                        </Button>
                                        <Button onClick={ this.loadCustomCategories } color="primary">
                                            Load JSON
                                        </Button>
                                        <Button onClick={ this.loadCustomCategoriesFromExcelPaste } color="primary">
                                            Load from Excel Template
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
