import * as React from "react";
import * as ReactDOM from "react-dom";
import { ICategory, ICategoryMetadata } from "../../../Types";
import { IGameData, IGameRound, RoundDescriptor } from "../Types";
import { Logger } from "../../../utilities/Logger";
import Slide from '@mui/material/Slide';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import LinearProgress from '@mui/material/LinearProgress';
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
    categorySearchResults: ICategoryMetadata[];
    searchInProgress: boolean
}


export class CategoryDetails extends React.Component<ICategoryDetailsProps, ICategoryDetailsState> {
    categorySearchTerm: string;
    gptTextBlock: string;

    constructor(props: any) {
        super(props);

        this.state = {
            category: this.props.category,
            categorySearchResults: null,
            searchInProgress: false
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
                            <h2>{ this.state.category.title }</h2>

                            <ul className="clueList">
                                {
                                    this.state.category.clues.map((clue, index) => {
                                        return (
                                            <li key={ index }>
                                                <div className="value">{ clue.value }</div>
                                                <div className="clue">{ clue.clue }</div>
                                                <div className="question">{ clue.question }</div>
                                            </li>
                                        )
                                    })
                                }
                            </ul >
                        </div>
                        <div id="changeCategory">
                            <h2>Category Picker</h2>

                            <Stack direction="column" spacing={ 2 }>
                                <Box sx={ { height: 10 } }>
                                    { this.state.searchInProgress &&
                                        <LinearProgress /> }
                                </Box>

                                <Stack direction="row" spacing={ 2 }>
                                    <Button variant="contained"
                                        disabled={ this.state.searchInProgress }
                                        onClick={ this.loadRandomCategory }>Get Random Category</Button>
                                </Stack>
                                <h3>Get Category by Topic</h3>

                                <TextField
                                    label="Search Term"
                                    onChange={ (event) => this.categorySearchTerm = event.target.value }
                                    onKeyDown={ (event) => { if (event.key === 'Enter') { this.searchForCategory() } } } />


                                <Stack direction="row" spacing={ 2 }>
                                    <Button
                                        variant="contained"
                                        disabled={ this.state.searchInProgress }
                                        onClick={ this.searchForCategory }>Search Jeopardy Archive</Button>
                                    <Button
                                        variant="contained"
                                        disabled={ this.state.searchInProgress }
                                        onClick={ this.generateCategoryFromGpt }>Generate from Gpt (ALPHA)</Button>
                                </Stack>

                                <h3>Get Questions from Text Block</h3>
                                <p>Copy some text from somewhere like Wikipedia, or paste a link to any webpage.</p>
                                <TextField
                                    fullWidth
                                    multiline
                                    onChange={ (event) => this.gptTextBlock = event.target.value } />
                                <Button variant="contained"
                                    disabled={ this.state.searchInProgress }
                                    onClick={ this.generateCategoryFromGptTextBlock }>Get From Text Block</Button>

                                <p>Note that GPT responses can take a long time to return and may not be correct; depending on where it sourced the information from.  If you want to edit the questions anfterwards, hit "Save" and then edit the JSON.</p>

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
            </Dialog >
        );
    }


    public loadRandomCategory = () => {
        Logger.debug("CategoryDetails:loadRandomCategory");

        if (!Debug.IsFlagSet(DebugFlags.LocalCategories)) {

            this.setState({ searchInProgress: true });

            let context: IApiExecutionContext = {
                apiName: "/api/Categories/RandomCategory/" + this.props.roundDescriptor,
                json: true,
                success: (results: ICategory) => {
                    this.setCategory(results);
                    this.setState({ searchInProgress: false });
                },
                error: () => {
                    this.setState({ searchInProgress: false });
                }
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
            this.setState({ searchInProgress: true });

            let context: IApiExecutionContext = {
                apiName: "/api/Categories/" + categoryMetadata.season + "/" + categoryMetadata.fileName,
                json: true,
                success: (results: ICategory) => {
                    this.setCategory(results);
                    this.setState({ searchInProgress: false });
                },
                error: () => {
                    this.setState({ searchInProgress: false });
                }
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

            this.setState({ searchInProgress: true });

            let context: IApiExecutionContext = {
                apiName: "/api/CategoryMetadata/Search/" + this.props.roundDescriptor + "/" + this.categorySearchTerm,
                json: true,
                success: (results: ICategoryMetadata[]) => {
                    this.setState({ categorySearchResults: results });
                    this.setState({ searchInProgress: false });
                },
                error: () => {
                    this.setState({ searchInProgress: false });
                }
            };

            let wsam: WebServerApiManager = new WebServerApiManager();
            wsam.executeApi(context);
        }
        else {
            // TODO
            alert("Can't Search Local Categories")
        }
    }

    public generateCategoryFromGpt = () => {
        Logger.debug("CategoryDetails:generateCategoryFromGpt");

        if (!Debug.IsFlagSet(DebugFlags.LocalCategories)) {

            // Do I have an OpenAI Key?
            let openAIKey: string = localStorage.getItem("OpenAIKey");
            if (openAIKey == null || openAIKey == "") {
                openAIKey = prompt("Enter your OpenAI Key")
                localStorage.setItem("OpenAIKey", openAIKey);
            }

            this.setState({ searchInProgress: true });

            let context: IApiExecutionContext = {
                apiName: "/api/Categories/gpt/" + this.categorySearchTerm + "?openAIKey=" + openAIKey,
                json: true,
                success: (results: ICategory) => {
                    this.setCategory(results);
                    this.setState({ searchInProgress: false });
                },
                error: () => {
                    this.setState({ searchInProgress: false });
                }
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

    public generateCategoryFromGptTextBlock = () => {
        Logger.debug("CategoryDetails:generateCategoryFromGptTextBlock");

        if (!Debug.IsFlagSet(DebugFlags.LocalCategories)) {

            // Do I have an OpenAI Key?
            let openAIKey: string = localStorage.getItem("OpenAIKey");
            if (openAIKey == null || openAIKey == "") {
                openAIKey = prompt("Enter your OpenAI Key")
                localStorage.setItem("OpenAIKey", openAIKey);
            }

            this.setState({ searchInProgress: true });

            let context: IApiExecutionContext = {
                apiName: "/api/Categories/gpt/fromText" + "?openAIKey=" + openAIKey,
                json: true,
                success: (results: ICategory) => {
                    this.setCategory(results);
                    this.setState({ searchInProgress: false });
                },
                error: () => {
                    this.setState({ searchInProgress: false });
                }
            };

            let wsam: WebServerApiManager = new WebServerApiManager();
            wsam.executePostApi(context, this.gptTextBlock);
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
