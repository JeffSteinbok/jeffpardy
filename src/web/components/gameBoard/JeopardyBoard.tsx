import * as React from "react";
import { JeopardyCategory } from "./JeopardyCategory"
import { WebServerApiManager, IApiExecutionContext } from "../../utilities/WebServerApiManager";
import { ICategory, IQuestion } from "./ICategory";
import { Logger } from "../../utilities/Logger";

export interface IJeopardyBoardState {
    categories: ICategory[];
    activeClue: IQuestion;
}

export interface IJeopardyBoard {
    showClue(clue: IQuestion);
}

export class JeopardyBoard extends React.Component<any, IJeopardyBoardState> implements IJeopardyBoard {

    private contextMenuTarget: any;
    private categories: ICategory = null;

    constructor(props: any) {
        super(props);
        this.state = {
            activeClue: null,
            categories: null
        }
    }

    private loadGameBoard() {
        let context: IApiExecutionContext = {
            showProgressIndicator: true,
            apiName: "Get-OneDriveMachine",
            formData: {},
            json: true,
            success: (results: any) => {
                this.setState({ "categories": results });
            },
            error: null
        };

        let wsam: WebServerApiManager = new WebServerApiManager();
        wsam.executeApi(context);
    }

    public showClue(clue: IQuestion) {
        this.setState({
            "activeClue": clue
        })
    }

    public componentDidMount() {
        this.loadGameBoard();
    }


    public render() {
        return (
            <div id="jeopardyBoardFrame">
                <div id="jeopardyBoardInnerFrame">
                    { this.state.categories &&
                        <div id="jeopardyBoard">
                            { this.state.activeClue == null &&
                                this.state.categories.map((value, index) => {
                                    return <JeopardyCategory key={ index } category={ value } jeopardyBoard={ this } />
                                }) }
                            { this.state.activeClue != null &&
                                <div className="jeopardyActiveClue">{ this.state.activeClue.clue }</div>
                            }
                        </div>
                    }
                </div>
            </div >
        );
    }
}
