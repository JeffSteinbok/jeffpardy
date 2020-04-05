import * as React from "react";
import { JeopardyCategory } from "./JeopardyCategory"
import { WebServerApiManager, IApiExecutionContext } from "../../utilities/WebServerApiManager";
import { ICategory, IQuestion } from "./ICategory";
import { Logger } from "../../utilities/Logger";

export interface IJeopardyBoardState {
    categories: ICategory[];
    activeClue: IQuestion;
    activeCategory: ICategory;
    activeClueValue: number;
    showQuestion: boolean;
}

export interface IJeopardyBoard {
    showClue(category: ICategory, value: number, clue: IQuestion);
}

export class JeopardyBoard extends React.Component<any, IJeopardyBoardState> implements IJeopardyBoard {

    private contextMenuTarget: any;
    private categories: ICategory = null;

    constructor(props: any) {
        super(props);
        this.state = {
            activeClue: null,
            activeCategory: null,
            activeClueValue: 0,
            categories: null,
            showQuestion: false
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

    public showClue(category: ICategory, value: number, clue: IQuestion) {
        this.setState({
            "activeClue": clue,
            activeClueValue: value,
            activeCategory: category
        })
    }

    hideClue = () => {
        this.setState({
            "activeClue": null,
            activeClueValue: null,
            activeCategory: null,
            showQuestion: false
        })
    };

    showQuestion = () => {
        this.setState({
            showQuestion: true,
        })
    };

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
                                <div className="jeopardyActiveClue">
                                    <div className="header">
                                        <div><button onClick={ this.hideClue }>Back</button></div>
                                        <div>{ this.state.activeCategory.title } for { this.state.activeClueValue }</div>
                                        <div><button onClick={ this.showQuestion }>Show Question</button></div>
                                    </div>
                                    <div className="clue">{ this.state.activeClue.clue }</div>
                                    { this.state.showQuestion == true &&
                                        <div className="question">{ this.state.activeClue.question }</div>
                                    }
                                </div>
                            }
                        </div>
                    }
                </div>
            </div >
        );
    }
}
