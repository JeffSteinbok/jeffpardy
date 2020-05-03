import * as React from "react";
import * as ReactDOM from "react-dom";
import { WebServerApiManager, IApiExecutionContext } from "../../utilities/WebServerApiManager";
import { ICategory } from "../hostPage/Types";
import { TextField } from "@material-ui/core";

interface IFromJeopardyLabsState {
    categoriesJson: string;
}

export class FromJeopardyLabs extends React.Component<any, IFromJeopardyLabsState> {

    jLabsUrlTemp: string;

    constructor(props: any) {
        super(props);

        this.state = {
            categoriesJson: ''
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
                this.setState({
                    categoriesJson: JSON.stringify(results, null, 4)
                })
            },
            error: null
        };

        let wsam: WebServerApiManager = new WebServerApiManager();
        wsam.executeApi(context);
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
                    onClick={ this.loadJeopardyLabs }>Load</button>
                <p />
                <div
                    style={ { fontSize: "0.9rem", fontFamily: "Courier", whiteSpace: "pre-wrap" } }>
                    { this.state.categoriesJson }
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
