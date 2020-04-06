import * as React from "react";
import { JeopardyCategory } from "./JeopardyCategory"
import { WebServerApiManager, IApiExecutionContext } from "../../utilities/WebServerApiManager";
import { ICategory, IQuestion } from "./ICategory";
import { Logger } from "../../utilities/Logger";
import { JeopardyController } from "../../JeopardyController";

export interface IJeopardyBoardProps {
    jeopardyController: JeopardyController;
}

export interface IJeopardyBoardState {
    categories: ICategory[];
    activeClue: IQuestion;
    activeCategory: ICategory;
    activeClueValue: number;
    showQuestion: boolean;
}

export interface IJeopardyBoard {
    showClue: (category: ICategory, value: number, clue: IQuestion) => void;
    hideClue: () => void;
}

export class JeopardyBoard extends React.Component<IJeopardyBoardProps, IJeopardyBoardState> implements IJeopardyBoard {

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

        this.props.jeopardyController.setJeopardyBoard(this);
    }

    private loadGameBoard() {
        Logger.debug("loadGameBoard");
        let context: IApiExecutionContext = {
            showProgressIndicator: true,
            apiName: "/api/Categories/GetGameBoard",
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
            activeClue: clue,
            activeClueValue: value,
            activeCategory: category
        });
        this.props.jeopardyController.showClue();
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
            <div id="jeopardyBoardFrame" >
                <div id="jeopardyBoardInnerFrame">
                    { this.state.categories &&
                        <div id="jeopardyBoard">
                            { this.state.activeClue == null &&
                                this.state.categories.map((value, index) => {
                                    return <JeopardyCategory key={ index } category={ value } jeopardyBoard={ this } />
                                }) }
                            { this.state.activeClue != null &&
                                <div className="jeopardyActiveClue">
                                    <div className="header">{ this.state.activeCategory.title } for { this.state.activeClueValue }</div>
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
