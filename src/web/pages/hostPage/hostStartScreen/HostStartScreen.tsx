import * as React from "react";
import * as ReactDOM from "react-dom";
import { ICategory } from "../../../Types";
import { IGameData, IGameRound, RoundDescriptor } from "../Types";
import { Logger } from "../../../utilities/Logger";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import { TextField, Link } from "@mui/material";
import { AnswerKey } from "./AnswerKey";
import { CategoryDetails } from "./CategoryDetails";
import { Attribution } from "../../../components/attribution/Attribution";
import { TeamDictionary } from "../../../Types";
import { JeffpardyHostController } from "../JeffpardyHostController";

import * as QRCode from "qrcode.react";

export enum HostStartScreenViewMode {
    Normal,
    AnswerKey
}

export interface IHostStartScreenProps {
    gameCode: string;
    hostCode: string;
    gameData: IGameData;
    teams: TeamDictionary;
    jeffpardyHostController: JeffpardyHostController;
    onModifyGameData: (gameData: IGameData) => void;
    onEnterLobby: () => void;
}

export interface IHostStartScreenState {
    viewMode: HostStartScreenViewMode;
    selectedCategory: ICategory;
    selectedCategoryRoundDescriptor: RoundDescriptor;
    isCustomCategoryDialogOpen: boolean;
    isCustomCategoryTsvDialogOpen: boolean;
    isCategoryDetailsDialogOpen: boolean;
}

/**
 * Root page for the host view, begins the rendering.
 */
export class HostStartScreen extends React.Component<IHostStartScreenProps, IHostStartScreenState> {

    customCategoryJSON: string;
    customCategoryTsv: string;
    isCustomCategoryDialogOpen: boolean = false;
    isCategoryDetailsDialogOpen: boolean = false;

    constructor(props: any) {
        super(props);

        this.state = {
            viewMode: HostStartScreenViewMode.Normal,
            selectedCategory: null,
            selectedCategoryRoundDescriptor: null,
            isCustomCategoryDialogOpen: false,
            isCustomCategoryTsvDialogOpen: false,
            isCategoryDetailsDialogOpen: false,
        }
    }

    public loadCustomCategories = () => {

        this.setState({ isCustomCategoryDialogOpen: false })
        this.props.onModifyGameData(JSON.parse(this.customCategoryJSON));
        alert("Please check the answer key to see if this loaded correctly.")
    }

    public loadCustomCategoriesFromExcelPaste = () => {
        this.setState({ isCustomCategoryTsvDialogOpen: false })

        // TODO: fix name
        let tsv: string = this.customCategoryTsv;

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

    public updateSingleCategory = (category: ICategory) => {
        this.props.jeffpardyHostController.updateSingleCategory(category);
    }

    public updateRound = (round: IGameRound) => {
        this.props.jeffpardyHostController.updateRound(round);
    }

    public showCategoryDetails = (round: IGameRound, category: ICategory) => {
        let roundDescriptor: RoundDescriptor = RoundDescriptor.Jeffpardy;
        if (round == null) {
            roundDescriptor = RoundDescriptor.FinalJeffpardy;
        } else if (round.id == 1) {
            roundDescriptor = RoundDescriptor.SuperJeffpardy;
        }


        this.setState({
            selectedCategory: category,
            selectedCategoryRoundDescriptor: roundDescriptor,
            isCategoryDetailsDialogOpen: true
        })
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

        let hostSecondaryWindowUri: string = "https://" +
            window.location.hostname +
            (window.location.port != "" ? ":" + window.location.port : "") +
            "/hostSecondary#" +
            this.props.gameCode +
            this.props.hostCode;

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
                            <div className="gameDataLoaded">
                                <div className="categoryListContainer">
                                    <ul className="categoryList">
                                        {
                                            this.props.gameData.rounds.map((round, index) => {
                                                return (
                                                    <li key={ index }><a href="#" onClick={ (e) => { this.updateRound(round); } }>🔄</a>
                                                        { round.name }
                                                        <ul>
                                                            {
                                                                round.categories.map((category, index) => {
                                                                    let airDate: Date = new Date(category.airDate);
                                                                    return (
                                                                        <li key={ index }>
                                                                            <a href="#" onClick={ (e) => { this.updateSingleCategory(category); } }>🔄</a>
                                                                            <a href="#" onClick={ (e) => { this.showCategoryDetails(round, category); } }>🔎</a>
                                                                            { category.title } - { airDate.getMonth() + 1 + "/" + airDate.getDay() + "/" + airDate.getFullYear() }
                                                                        </li>
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
                                                <li>
                                                    <a href="#" onClick={ (e) => { this.updateSingleCategory(finalCategory); } }>🔄</a>
                                                    <a href="#" onClick={ (e) => { this.showCategoryDetails(null, finalCategory); } }>🔎</a>
                                                    { finalCategory.title } - { finalAirDate.getMonth() + 1 + "/" + finalAirDate.getDay() + "/" + finalAirDate.getFullYear() }</li>
                                            </ul>
                                        </li>

                                    </ul>
                                </div>

                                <div className="customize">

                                    <div className="buttons">
                                        <button onClick={ () => { this.setState({ isCustomCategoryDialogOpen: true }) } }>Edit Game Data JSON</button>
                                        <button onClick={ () => { this.setState({ isCustomCategoryTsvDialogOpen: true }) } }>Paste from Excel Template</button>
                                        <button onClick={ this.showAnswerKey }>Show Clues &amp; Answers</button>
                                    </div>

                                    <a href="/fromJeopardyLabs">Pull from JeopardyLabs</a>&nbsp;|&nbsp;
                                    <a href="/JeffpardyGameDataTemplate.xlsx" target="#">Download Excel Template</a>
                                </div>
                                <p></p>

                                <div className="secondaryWindow">
                                    <button onClick={ () => {
                                        window.open(hostSecondaryWindowUri, 'Jeffpardy Host Secondary Window', 'width=600,height=600');
                                    } }> Host Secondary Window</button><br />
                                    Show this page on another window to show the answer to just the host.  Do not share this link with the players.
                                    <p />
                                    <QRCode.QRCodeCanvas
                                        value={ hostSecondaryWindowUri }
                                        size={ 128 }
                                        includeMargin={ true } />
                                </div>
                                <p />

                                <button onClick={ this.props.onEnterLobby }>Enter Game Lobby</button>
                                <br />
                                Don't forget to save or print the answer key before you start, or use the host secondary screen.<br />
                                If you don't, you won't be able to during the game.

                                <div className="flexGrowSpacer"></div>
                                <Attribution />
                                { this.state.isCustomCategoryDialogOpen &&
                                    <Dialog
                                        open={ this.state.isCustomCategoryDialogOpen }
                                        keepMounted
                                        fullWidth
                                        maxWidth={ false }
                                    >
                                        <DialogTitle>{ "Modify this JSON" }</DialogTitle>
                                        <DialogContent>
                                            <TextField
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
                                        </DialogActions>
                                    </Dialog>
                                }

                                <Dialog
                                    open={ this.state.isCustomCategoryTsvDialogOpen }
                                    keepMounted
                                    fullWidth
                                    maxWidth={ false }
                                >
                                    <DialogTitle>{ "Paste from Excel Template" }</DialogTitle>
                                    <DialogContent>
                                        <Link href="/JeffpardyGameDataTemplate.xlsx"
                                            target="#">Download Excel Template</Link>
                                        <TextField
                                            label="Paste Excel content here."
                                            fullWidth
                                            multiline
                                            rows={ 40 }
                                            onChange={ (event) => this.customCategoryTsv = event.target.value } />
                                    </DialogContent>
                                    <DialogActions>
                                        <Button onClick={ () => { this.setState({ isCustomCategoryTsvDialogOpen: false }) } }>
                                            Cancel
                                        </Button>
                                        <Button onClick={ this.loadCustomCategoriesFromExcelPaste } color="primary">
                                            Load
                                        </Button>
                                    </DialogActions>
                                </Dialog>

                                { this.state.isCategoryDetailsDialogOpen &&
                                    <CategoryDetails
                                        roundDescriptor={ this.state.selectedCategoryRoundDescriptor }
                                        category={ this.state.selectedCategory }
                                        onSave={ (category: ICategory) => {
                                            this.props.jeffpardyHostController.replaceSingleCategory(this.state.selectedCategory, category)
                                            this.setState({ isCategoryDetailsDialogOpen: false });
                                        } }
                                        onCancel={ () => {
                                            this.setState({ isCategoryDetailsDialogOpen: false })
                                        } }

                                    />
                                }

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
            </div >
        );
    }
}
