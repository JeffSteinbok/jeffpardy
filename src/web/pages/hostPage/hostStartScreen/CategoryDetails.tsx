import * as React from "react";
import * as ReactDOM from "react-dom";
import { ICategory, ICategoryMetadata } from "../../../Types";
import { IGameData, IGameRound, RoundDescriptor } from "../Types";
import { Logger } from "../../../utilities/Logger";
import Slide from '@mui/material/Slide';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { TextField, Link } from "@mui/material";
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
    categorySearchResults: ICategoryMetadata[]
}


export class CategoryDetails extends React.Component<ICategoryDetailsProps, ICategoryDetailsState> {
    categorySearchTerm: string;

    constructor(props: any) {
        super(props);

        this.state = {
            category: this.props.category,
            categorySearchResults: null
        }
    }

    public render() {
        Logger.debug("CategoryDetails:render", this.state.category);

        return (

            <Dialog
                open={ true }
                keepMounted
                fullScreen={ true }
                onClose={ () => this.props.onCancel() }
            >
                <DialogTitle>{ "Category Details" }</DialogTitle>
                <DialogContent>

                    <div id="categoryDetails">
                        <div id="viewCategory">
                            <h1>{ this.state.category.title }</h1>

                            <ul className="clueList">
                                {
                                    this.state.category.clues.map((clue, index) => {
                                        return (
                                            <li key={ index }>
                                                <div className="value">{ clue.value }{ clue.isDailyDouble ? " - DD" : "" }</div>
                                                <div className="clue">{ clue.clue }</div>
                                                <div className="question">{ clue.question }</div>
                                            </li>
                                        )
                                    })
                                }
                            </ul >
                        </div>
                        <div id="changeCategory">
                            <p>Get a new category - search or get a random one.</p>
                            <Stack direction="column" spacing={ 2 }>
                                <TextField
                                    label="Search Term"
                                    onChange={ (event) => this.categorySearchTerm = event.target.value }
                                    onKeyDown={ (event) => { if (event.key === 'Enter') { this.searchForCategory() } } } />

                                <Stack direction="row" spacing={ 2 }>
                                    <Button
                                        variant="contained"
                                        onClick={ this.searchForCategory }>Search</Button>
                                    <Button variant="outlined"
                                        onClick={ this.loadRandomCategory }>Get Random Category</Button>
                                </Stack>

                            </Stack>


                            { this.state.categorySearchResults &&
                                <List className="categorySearchResults"
                                    dense={ true } >
                                    {
                                        this.state.categorySearchResults.map((categoryMetaData, index) => {
                                            let airDate: Date = new Date(categoryMetaData.airDate);
                                            return (
                                                <ListItem key={ index } disablePadding={ true }>

                                                    <ListItemButton onClick={ (e) => { this.loadCategory(categoryMetaData); } }>
                                                        <ListItemText>{ categoryMetaData.title } - { airDate.getMonth() + 1 + "/" + airDate.getDay() + "/" + airDate.getFullYear() }</ListItemText>
                                                    </ListItemButton>
                                                </ListItem>
                                            )
                                        })
                                    }
                                </List >
                            }
                        </div>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={ () => { this.props.onSave(this.state.category) } }>
                        Save
                    </Button>
                    <Button onClick={ () => { this.props.onCancel() } }>
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }


    public loadRandomCategory = () => {
        Logger.debug("CategoryDetails:loadRandomCategory");

        if (!Debug.IsFlagSet(DebugFlags.LocalCategories)) {
            let context: IApiExecutionContext = {
                showProgressIndicator: true,
                apiName: "/api/Categories/RandomCategory/" + this.props.roundDescriptor,
                formData: {},
                json: true,
                success: (results: ICategory) => {
                    this.setCategory(results)
                },
                error: null
            };

            let wsam: WebServerApiManager = new WebServerApiManager();
            wsam.executeApi(context);
        }
        else {
            let category: ICategory;
            if (this.props.roundDescriptor != RoundDescriptor.FinalJeffpardy) {
                category = Debug.generateCategory();
            }
            else {
                category = Debug.generateFinalCategory();
            }
            this.setState({ category: category })

        }
    }

    public loadCategory = (categoryMetadata: ICategoryMetadata) => {
        Logger.debug("CategoryDetails:loadCategory");

        if (!Debug.IsFlagSet(DebugFlags.LocalCategories)) {
            let context: IApiExecutionContext = {
                showProgressIndicator: true,
                apiName: "/api/Categories/" + categoryMetadata.season + "/" + categoryMetadata.fileName,
                formData: {},
                json: true,
                success: (results: ICategory) => {
                    this.setCategory(results);
                },
                error: null
            };

            let wsam: WebServerApiManager = new WebServerApiManager();
            wsam.executeApi(context);
        }
        else {
            // TODO
            alert("Can't Search Local Categories")
        }
    }

    public searchForCategory = () => {
        Logger.debug("CategoryDetails:searchForCategory");

        if (!Debug.IsFlagSet(DebugFlags.LocalCategories)) {
            let context: IApiExecutionContext = {
                showProgressIndicator: true,
                apiName: "/api/CategoryMetadata/Search/" + this.props.roundDescriptor + "/" + this.categorySearchTerm,
                formData: {},
                json: true,
                success: (results: ICategoryMetadata[]) => {
                    this.setState({ categorySearchResults: results })
                },
                error: null
            };

            let wsam: WebServerApiManager = new WebServerApiManager();
            wsam.executeApi(context);
        }
        else {
            // TODO
            alert("Can't Search Local Categories")
        }
    }

    public setCategory = (category: ICategory) => {
        // This sucks that I have to do this here too and in the controller

        if (this.props.roundDescriptor != RoundDescriptor.FinalJeffpardy) {
            let roundMultiplier: number = 1;
            if (this.props.roundDescriptor == RoundDescriptor.SuperJeffpardy) {
                roundMultiplier = 2;
            }
            // Assign the scores
            for (var i: number = 0; i < category.clues.length; i++) {
                category.clues[i].value = (i + 1) * 100 * roundMultiplier;
            }
        }
        this.setState({ category: category });
    }
}
