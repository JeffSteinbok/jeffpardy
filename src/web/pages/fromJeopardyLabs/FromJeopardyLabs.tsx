import * as React from "react";
import * as ReactDOM from "react-dom";
import { WebServerApiManager, IApiExecutionContext } from "../../utilities/WebServerApiManager";
import { IGameData } from "../hostPage/Types";
import { ICategory } from "../../Types";
import TextField from '@mui/material/TextField';

interface IFromJeopardyLabsState {
    categories: ICategory[]
    gameData: IGameData;
}

export class FromJeopardyLabs extends React.Component<any, IFromJeopardyLabsState> {

    jLabsUrlTemp: string;

    constructor(props: any) {
        super(props);

        this.state = {
            gameData: null,
            categories: []
        }
    }

    loadJeopardyLabs = () => {

        let jLabsGameId: string = this.jLabsUrlTemp.substring(this.jLabsUrlTemp.lastIndexOf('/') + 1);

        let context: IApiExecutionContext = {
            showProgressIndicator: true,
            apiName: "/api/parseJeopardyLabs?jeopardyLabsGame=" + jLabsGameId,
            formData: {},
            json: true,
            success: (results: ICategory[]) => {
                let validCategories: ICategory[] = [];
                results.forEach((value, index) => {
                    if (value.clues.length == 5) {
                        validCategories.push(value);
                    }
                })
                this.setState({
                    categories: this.state.categories.concat(validCategories)
                })
            },
            error: null
        };

        let wsam: WebServerApiManager = new WebServerApiManager();
        wsam.executeApi(context);
    }

    generateGameData = () => {
        let gameData: IGameData = {
            rounds: [],
            finalJeffpardyCategory: null
        }

        let finalJeffpardyCategoryIndex = 0;

        if (this.state.categories.length < 7) {
            alert("You need at least 7 categories for a game.");
        }
        if (this.state.categories.length >= 7) {
            gameData.rounds.push({
                id: 0,
                name: "Jeffpardy",
                categories: this.state.categories.slice(0, 6)
            })

            finalJeffpardyCategoryIndex = 6;
        }
        if (this.state.categories.length >= 12) {
            gameData.rounds.push({
                id: 1,
                name: "Super Jeffpardy",
                categories: this.state.categories.slice(6, 12)
            })

            finalJeffpardyCategoryIndex = 12;
        }

        let finalJeffpardyCategory = this.state.categories[finalJeffpardyCategoryIndex];
        gameData.finalJeffpardyCategory = {
            title: finalJeffpardyCategory.title,
            comment: finalJeffpardyCategory.comment,
            airDate: finalJeffpardyCategory.airDate,
            isAsked: finalJeffpardyCategory.isAsked,
            hasDailyDouble: finalJeffpardyCategory.hasDailyDouble,
            clues: finalJeffpardyCategory.clues.slice(0, 1)
        }
        this.setState({
            gameData: gameData
        });
    }

    public render() {
        return (
            <div id="fromJeopardyLabs">
                <div className="title">Jeffpardy!</div>
                <div>Paste a URL from <a href="https://www.jeopardylabs.com" target="#">JeopardyLabs</a>.</div>
                <div>Note that a Jeffpardy game board has 30 clues; not all boards on JeopardyLabs have 30; many have 25.</div>
                <input
                    type="text"
                    onChange={ e => { this.jLabsUrlTemp = e.target.value } } />
                <br />
                <button
                    onClick={ this.loadJeopardyLabs }>Load Categories</button>
                <p />
                <div>
                    Categories Loaded: { this.state.categories.length }
                    <ul>
                        { this.state.categories.map((category, index) => {
                            return (
                                <li key={ index }> { category.title } </li>
                            )
                        })
                        }
                    </ul>
                </div>
                <button
                    onClick={ this.generateGameData }>Generate Game Data</button>
                <div
                    style={ { fontSize: "0.9rem", fontFamily: "Courier", whiteSpace: "pre-wrap" } }>
                    { JSON.stringify(this.state.gameData, (key, value) => {
                        if (key == "isAsked") return undefined;
                        else if (key == "isDailyDouble") return undefined;
                        else if (key == "hasDailyDouble") return undefined;
                        else if (key == "value") return undefined;
                        else return value;
                    }, 4) }
                </div>
            </div>
        );
    }
}


// Start the application
let root = document.createElement("div");
root.id = 'main';
document.body.appendChild(root);
ReactDOM.render(
    <FromJeopardyLabs />,
    document.getElementById("main")
);
