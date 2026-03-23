// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { ICategory, ICategoryMetadata } from "../../../Types";
import { RoundDescriptor } from "../Types";
import { Logger } from "../../../utilities/Logger";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import LinearProgress from "@mui/material/LinearProgress";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { TextField } from "@mui/material";
import { Debug, DebugFlags } from "../../../utilities/Debug";
import { WebServerApiManager, IApiExecutionContext } from "../../../utilities/WebServerApiManager";

export interface ICategoryDetailsProps {
    roundDescriptor: RoundDescriptor;
    category: ICategory;
    onSave: (category: ICategory) => void;
    onCancel: () => void;
}

export interface ICategoryDetailsState {
    category: ICategory;
    categorySearchResults: ICategoryMetadata[];
    searchInProgress: boolean;
}

/** Dialog for viewing and replacing a single game category, with random selection and archive search capabilities. */
export class CategoryDetails extends React.Component<ICategoryDetailsProps, ICategoryDetailsState> {
    categorySearchTerm: string;

    constructor(props: ICategoryDetailsProps) {
        super(props);

        this.state = {
            category: this.props.category,
            categorySearchResults: null,
            searchInProgress: false,
        };
    }

    public render() {
        Logger.debug("CategoryDetails:render", this.state.category);

        return (
            <Dialog
                open={true}
                keepMounted
                fullWidth
                maxWidth="lg"
                onClose={() => this.props.onCancel()}
                PaperProps={{ className: "gameDialog", style: { height: "80vh" } }}
            >
                <DialogTitle>Category Details</DialogTitle>
                <DialogContent>
                    <div id="categoryDetails">
                        <div id="viewCategory">
                            <h2>{this.state.category.title}</h2>

                            <ul className="clueList">
                                {this.state.category.clues.map((clue, index) => {
                                    return (
                                        <li key={index}>
                                            <div className="value">{clue.value}</div>
                                            <div className="clue">{clue.clue}</div>
                                            <div className="question">{clue.question}</div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                        <div id="changeCategory">
                            <h2>Category Picker</h2>

                            <Stack direction="column" spacing={2}>
                                <Box sx={{ height: 10 }}>{this.state.searchInProgress && <LinearProgress />}</Box>

                                <Stack direction="row" spacing={2}>
                                    <Button
                                        variant="contained"
                                        disabled={this.state.searchInProgress}
                                        onClick={this.loadRandomCategory}
                                    >
                                        Get Random Category
                                    </Button>
                                </Stack>
                                <h3>Get Category by Topic</h3>

                                <TextField
                                    label="Search Term"
                                    onChange={(event) => (this.categorySearchTerm = event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            this.searchForCategory();
                                        }
                                    }}
                                />

                                <Stack direction="row" spacing={2}>
                                    <Button
                                        variant="contained"
                                        disabled={this.state.searchInProgress}
                                        onClick={this.searchForCategory}
                                    >
                                        Search Jeopardy Archive
                                    </Button>
                                </Stack>
                            </Stack>

                            {this.state.categorySearchResults && (
                                <List className="categorySearchResults" dense={true}>
                                    {this.state.categorySearchResults.map((categoryMetaData, index) => {
                                        const airDate: Date = new Date(categoryMetaData.airDate);
                                        return (
                                            <ListItem key={index} disablePadding={true}>
                                                <ListItemButton
                                                    onClick={(_e) => {
                                                        this.loadCategory(categoryMetaData);
                                                    }}
                                                >
                                                    <ListItemText>
                                                        {categoryMetaData.title} -{" "}
                                                        {airDate.getMonth() +
                                                            1 +
                                                            "/" +
                                                            airDate.getDay() +
                                                            "/" +
                                                            airDate.getFullYear()}
                                                    </ListItemText>
                                                </ListItemButton>
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            )}
                        </div>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            this.props.onCancel();
                        }}
                        style={{ backgroundColor: "#555", color: "white" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            this.props.onSave(this.state.category);
                        }}
                        color="primary"
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    public loadRandomCategory = () => {
        Logger.debug("CategoryDetails:loadRandomCategory");

        if (!Debug.IsFlagSet(DebugFlags.LocalCategories)) {
            this.setState({ searchInProgress: true });

            const context: IApiExecutionContext = {
                apiName: "/api/Categories/RandomCategory/" + this.props.roundDescriptor,
                json: true,
                success: (results: ICategory) => {
                    this.setCategory(results);
                    this.setState({ searchInProgress: false });
                },
                error: () => {
                    this.setState({ searchInProgress: false });
                },
            };

            const wsam: WebServerApiManager = new WebServerApiManager();
            wsam.executeApi(context);
        } else {
            let category: ICategory;
            if (this.props.roundDescriptor != RoundDescriptor.FinalJeffpardy) {
                category = Debug.generateCategory();
            } else {
                category = Debug.generateFinalCategory();
            }
            this.setState({ category: category });
        }
    };

    public loadCategory = (categoryMetadata: ICategoryMetadata) => {
        Logger.debug("CategoryDetails:loadCategory");

        if (!Debug.IsFlagSet(DebugFlags.LocalCategories)) {
            this.setState({ searchInProgress: true });

            const context: IApiExecutionContext = {
                apiName:
                    "/api/Categories/" +
                    categoryMetadata.season +
                    "/" +
                    categoryMetadata.fileName +
                    "?index=" +
                    categoryMetadata.index,
                json: true,
                success: (results: ICategory) => {
                    this.setCategory(results);
                    this.setState({ searchInProgress: false });
                },
                error: () => {
                    this.setState({ searchInProgress: false });
                },
            };

            const wsam: WebServerApiManager = new WebServerApiManager();
            wsam.executeApi(context);
        } else {
            // TODO
            alert("Can't Search Local Categories");
        }
    };

    public searchForCategory = () => {
        Logger.debug("CategoryDetails:searchForCategory");

        if (!Debug.IsFlagSet(DebugFlags.LocalCategories)) {
            this.setState({ searchInProgress: true });

            const context: IApiExecutionContext = {
                apiName: "/api/CategoryMetadata/Search/" + this.props.roundDescriptor + "/" + this.categorySearchTerm,
                json: true,
                success: (results: ICategoryMetadata[]) => {
                    this.setState({ categorySearchResults: results });
                    this.setState({ searchInProgress: false });
                },
                error: () => {
                    this.setState({ searchInProgress: false });
                },
            };

            const wsam: WebServerApiManager = new WebServerApiManager();
            wsam.executeApi(context);
        } else {
            // TODO
            alert("Can't Search Local Categories");
        }
    };

    public setCategory = (category: ICategory) => {
        // This sucks that I have to do this here too and in the controller

        if (this.props.roundDescriptor != RoundDescriptor.FinalJeffpardy) {
            let roundMultiplier: number = 1;
            if (this.props.roundDescriptor == RoundDescriptor.SuperJeffpardy) {
                roundMultiplier = 2;
            }
            // Assign the scores
            for (let i: number = 0; i < category.clues.length; i++) {
                category.clues[i].value = (i + 1) * 100 * roundMultiplier;
            }
        }
        this.setState({ category: category });
    };
}
