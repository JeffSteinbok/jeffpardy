// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { ICategory } from "../../../Types";
import { IGameData, IGameRound, RoundDescriptor } from "../Types";
import { Logger } from "../../../utilities/Logger";
import { AnswerKey } from "./AnswerKey";
import { CategoryDetails } from "./CategoryDetails";
import { Attribution } from "../../../components/attribution/Attribution";
import { TeamDictionary } from "../../../Types";
import { JeffpardyHostController } from "../JeffpardyHostController";
import { CustomCategoryDialog } from "./CustomCategoryDialog";
import { ExcelTemplateDialog } from "./ExcelTemplateDialog";
import { parseGameDataFromTsv } from "./TsvCategoryParser";
import { Snackbar, Alert } from "@mui/material";

import * as QRCode from "qrcode.react";

export enum HostStartScreenViewMode {
    Normal,
    AnswerKey,
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
    snackbarOpen: boolean;
}

/**
 * Pre-game setup screen where the host can review and modify categories, load custom game data, and enter the lobby.
 */
export class HostStartScreen extends React.Component<IHostStartScreenProps, IHostStartScreenState> {
    constructor(props: IHostStartScreenProps) {
        super(props);

        this.state = {
            viewMode: HostStartScreenViewMode.Normal,
            selectedCategory: null,
            selectedCategoryRoundDescriptor: null,
            isCustomCategoryDialogOpen: false,
            isCustomCategoryTsvDialogOpen: false,
            isCategoryDetailsDialogOpen: false,
            snackbarOpen: false,
        };
    }

    public loadCustomCategories = (json: string) => {
        this.setState({ isCustomCategoryDialogOpen: false, snackbarOpen: true });
        this.props.onModifyGameData(JSON.parse(json));
    };

    public loadCustomCategoriesFromExcelPaste = (tsv: string) => {
        this.setState({ isCustomCategoryTsvDialogOpen: false, snackbarOpen: true });
        const gameData = parseGameDataFromTsv(tsv);
        this.props.onModifyGameData(gameData);
    };

    public updateSingleCategory = (category: ICategory) => {
        this.props.jeffpardyHostController.updateSingleCategory(category);
    };

    public updateRound = (round: IGameRound) => {
        this.props.jeffpardyHostController.updateRound(round);
    };

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
            isCategoryDetailsDialogOpen: true,
        });
    };

    public showAnswerKey = () => {
        this.setState({
            viewMode: HostStartScreenViewMode.AnswerKey,
        });
    };

    public hideAnswerKey = () => {
        this.setState({
            viewMode: HostStartScreenViewMode.Normal,
        });
    };

    public startGame = () => {
        this.props.onEnterLobby();
    };

    public render() {
        Logger.debug("HostStartScreen:render", this.props.gameData);

        let finalCategory: ICategory;
        let finalAirDate: Date;

        const hostSecondaryWindowUri: string =
            window.location.origin + "/hostSecondary#" + this.props.gameCode + this.props.hostCode;

        if (this.props.gameData != null) {
            finalCategory = this.props.gameData.finalJeffpardyCategory;
            finalAirDate = new Date(finalCategory.airDate);
        }

        return (
            <div>
                {this.state.viewMode == HostStartScreenViewMode.Normal && (
                    <div className="hostStartPage">
                        <button className="backButton" onClick={() => (window.location.href = "/")}>
                            ← Back
                        </button>
                        <div className="titleContainer">
                            <img src="/images/JeffpardyTitle.png" className="title" alt="Jeffpardy" />
                        </div>

                        {this.props.gameData == null && <div>Finding some really great clues...</div>}
                        {this.props.gameData != null && (
                            <div className="gameDataLoaded hostLobbyFadeIn">
                                <div className="categoryListContainer">
                                    <ul className="categoryList">
                                        {this.props.gameData.rounds.map((round, index) => {
                                            return (
                                                <li key={index}>
                                                    <a
                                                        href="#"
                                                        onClick={(_e) => {
                                                            this.updateRound(round);
                                                        }}
                                                    >
                                                        🔄
                                                    </a>
                                                    {round.name}
                                                    <ul>
                                                        {round.categories.map((category, index) => {
                                                            const airDate: Date = new Date(category.airDate);
                                                            return (
                                                                <li key={index}>
                                                                    <a
                                                                        href="#"
                                                                        onClick={(_e) => {
                                                                            this.updateSingleCategory(category);
                                                                        }}
                                                                    >
                                                                        🔄
                                                                    </a>
                                                                    <a
                                                                        href="#"
                                                                        onClick={(_e) => {
                                                                            this.showCategoryDetails(round, category);
                                                                        }}
                                                                    >
                                                                        🔎
                                                                    </a>
                                                                    {category.title} -{" "}
                                                                    {airDate.getMonth() +
                                                                        1 +
                                                                        "/" +
                                                                        airDate.getDate() +
                                                                        "/" +
                                                                        airDate.getFullYear()}
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                    <ul className="categoryList" style={{ columns: 1 }}>
                                        <li>
                                            Final Jeffpardy
                                            <ul>
                                                <li>
                                                    <a
                                                        href="#"
                                                        onClick={(_e) => {
                                                            this.updateSingleCategory(finalCategory);
                                                        }}
                                                    >
                                                        🔄
                                                    </a>
                                                    <a
                                                        href="#"
                                                        onClick={(_e) => {
                                                            this.showCategoryDetails(null, finalCategory);
                                                        }}
                                                    >
                                                        🔎
                                                    </a>
                                                    {finalCategory.title} -{" "}
                                                    {finalAirDate.getMonth() +
                                                        1 +
                                                        "/" +
                                                        finalAirDate.getDate() +
                                                        "/" +
                                                        finalAirDate.getFullYear()}
                                                </li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>

                                <div className="customize">
                                    <div className="buttons">
                                        <button
                                            onClick={() => {
                                                this.setState({ isCustomCategoryDialogOpen: true });
                                            }}
                                        >
                                            Edit Game Data JSON
                                        </button>
                                        <button
                                            onClick={() => {
                                                this.setState({ isCustomCategoryTsvDialogOpen: true });
                                            }}
                                        >
                                            Use Excel Template
                                        </button>
                                        <button onClick={this.showAnswerKey}>Printable Answer Key</button>
                                    </div>
                                </div>
                                <p></p>

                                <div className="lobbyButtons">
                                    <div className="lobbyButtonGroup">
                                        <button
                                            onClick={() => {
                                                window.open(
                                                    hostSecondaryWindowUri,
                                                    "Jeffpardy Host Secondary Window",
                                                    "width=600,height=600"
                                                );
                                            }}
                                        >
                                            Launch Host Window
                                        </button>
                                        <span className="lobbyButtonSubtext">Shows answers to the host only</span>
                                        <span className="lobbyButtonSubtext">Do not share this window</span>
                                        <div
                                            style={{
                                                background: "white",
                                                padding: "4px",
                                                display: "inline-block",
                                                borderRadius: "4px",
                                                marginTop: "8px",
                                            }}
                                        >
                                            <QRCode.QRCodeCanvas
                                                value={hostSecondaryWindowUri}
                                                size={80}
                                                includeMargin={false}
                                            />
                                        </div>
                                    </div>
                                    <div className="lobbyButtonGroup">
                                        <button onClick={this.props.onEnterLobby}>Enter Game Lobby</button>
                                    </div>
                                </div>

                                <div className="flexGrowSpacer"></div>
                                <Attribution />
                                {this.state.isCustomCategoryDialogOpen && (
                                    <CustomCategoryDialog
                                        gameData={this.props.gameData}
                                        onLoad={(json) => this.loadCustomCategories(json)}
                                        onClose={() => this.setState({ isCustomCategoryDialogOpen: false })}
                                    />
                                )}

                                {this.state.isCustomCategoryTsvDialogOpen && (
                                    <ExcelTemplateDialog
                                        onLoad={(tsv) => this.loadCustomCategoriesFromExcelPaste(tsv)}
                                        onClose={() => this.setState({ isCustomCategoryTsvDialogOpen: false })}
                                    />
                                )}

                                {this.state.isCategoryDetailsDialogOpen && (
                                    <CategoryDetails
                                        roundDescriptor={this.state.selectedCategoryRoundDescriptor}
                                        category={this.state.selectedCategory}
                                        onSave={(category: ICategory) => {
                                            this.props.jeffpardyHostController.replaceSingleCategory(
                                                this.state.selectedCategory,
                                                category
                                            );
                                            this.setState({ isCategoryDetailsDialogOpen: false });
                                        }}
                                        onCancel={() => {
                                            this.setState({ isCategoryDetailsDialogOpen: false });
                                        }}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}
                {this.state.viewMode == HostStartScreenViewMode.AnswerKey && (
                    <AnswerKey gameData={this.props.gameData} onHide={this.hideAnswerKey} />
                )}
                <Snackbar
                    open={this.state.snackbarOpen}
                    autoHideDuration={5000}
                    onClose={() => this.setState({ snackbarOpen: false })}
                    anchorOrigin={{ vertical: "top", horizontal: "center" }}
                >
                    <Alert onClose={() => this.setState({ snackbarOpen: false })} severity="info" variant="filled">
                        Please check the answer key to see if this loaded correctly.
                    </Alert>
                </Snackbar>
            </div>
        );
    }
}
