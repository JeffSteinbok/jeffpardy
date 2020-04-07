import * as React from "react";
import { JeopardyCategory } from "./JeopardyCategory"
import { Logger } from "../../utilities/Logger";
import { JeopardyController, ICategory, IClue } from "../../JeopardyController";
import { JeopardyClue } from "./JeopardyClue"

export interface IJeopardyBoardProps {
    jeopardyController: JeopardyController;
}

export interface IJeopardyBoardState {
    categories: ICategory[];
    activeClue: IClue;
    activeCategory: ICategory;
    showQuestion: boolean;
}

export interface IJeopardyBoard {
    onCategoriesLoaded: (categories: ICategory[]) => void;
    showClue: (category: ICategory, clue: IClue) => void;
    showQuestion: () => void;
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
            categories: null,
            showQuestion: false
        }

        this.props.jeopardyController.setJeopardyBoard(this);
    }

    public onCategoriesLoaded = (categories: ICategory[]) => {
        this.setState({ categories: categories })
    }

    public showClue = (category: ICategory, clue: IClue) => {
        this.setState({
            activeClue: clue,
            activeCategory: category
        });
        this.props.jeopardyController.showClue(clue);
    }

    public showQuestion = () => {
        this.setState({
            showQuestion: true,
        })
    };

    public hideClue = () => {
        this.setState({
            "activeClue": null,
            activeCategory: null,
            showQuestion: false
        })
    };

    public componentDidMount() {
        this.props.jeopardyController.loadCategories();
    }

    public render() {

        let boardGridElements: JSX.Element[] = [];

        if (this.state.categories && this.state.activeClue == null) {

            // Generate the grid of DIVs.  Doesn't work super-well in the below because they are not
            // nested.
            var keyCounter: number = 0;
            for (var i: number = 0; i < this.state.categories.length; i++) {
                let category: ICategory = this.state.categories[i];
                boardGridElements.push(<div className="jeopardyCategory" key={ keyCounter++ } style={ { gridRow: 1, gridColumn: i + 1 } }><JeopardyCategory category={ category } jeopardyBoard={ this } /></div>);

                for (var j: number = 0; j < category.questions.length; j++) {
                    let clue: IClue = category.questions[j];
                    boardGridElements.push(<div className="jeopardyClue" key={ keyCounter++ } style={ { gridRow: j + 2, gridColumn: i + 1 } }><JeopardyClue jeopardyBoard={ this } category={ category } clue={ clue } /></div>);
                }
            }
        }

        return (
            <div id="jeopardyBoardFrame" >
                <div id="jeopardyBoardInnerFrame">
                    { this.state.categories &&
                        <div id="jeopardyBoard">
                            { this.state.activeClue == null &&
                                <div className="jeopardyBoardClues">
                                    { boardGridElements }
                                </div>
                            }
                            { this.state.activeClue != null &&
                                <div className="jeopardyActiveClue">
                                    <div className="header">{ this.state.activeCategory.title } for { this.state.activeClue.value }</div>
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
