import * as React from "react";
import { JeffpardyCategory } from "./JeffpardyCategory"
import { Logger } from "../../utilities/Logger";
import { JeffpardyHostController, ICategory, IClue } from "../../JeffpardyHostController";
import { JeffpardyClue } from "./JeffpardyClue"

export interface IJeffpardyBoardProps {
    jeffpardyController: JeffpardyHostController;
    categories: ICategory[];
}

export interface IJeffpardyBoardState {
    categories: ICategory[];
    activeClue: IClue;
    activeCategory: ICategory;
    showQuestion: boolean;
}

export interface IJeffpardyBoard {
    showClue: (category: ICategory, clue: IClue) => void;
    showQuestion: () => void;
    hideClue: () => void;
}

export class JeffpardyBoard extends React.Component<IJeffpardyBoardProps, IJeffpardyBoardState> implements IJeffpardyBoard {

    private contextMenuTarget: any;
    private categories: ICategory = null;

    constructor(props: any) {
        super(props);

        Logger.debug("JeffpardyBoard:constructor", this.props.categories);

        this.state = {
            activeClue: null,
            activeCategory: null,
            categories: this.props.categories,
            showQuestion: false
        }

        this.props.jeffpardyController.setJeffpardyBoard(this);
    }

    public showClue = (category: ICategory, clue: IClue) => {
        this.setState({
            activeClue: clue,
            activeCategory: category
        });
        this.props.jeffpardyController.showClue(clue);
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

    public render() {

        Logger.debug("JeffpardyBoard:render", this.props.categories);

        let boardGridElements: JSX.Element[] = [];

        if (this.props.categories && this.state.activeClue == null) {
            Logger.debug("Drawing Categories!", this.props.categories);
            // Generate the grid of DIVs.  Doesn't work super-well in the below because they are not
            // nested.
            var keyCounter: number = 0;
            for (var i: number = 0; i < this.props.categories.length; i++) {
                let category: ICategory = this.props.categories[i];
                boardGridElements.push(<div className="jeffpardyCategory" key={ keyCounter++ } style={ { gridRow: 1, gridColumn: i + 1 } }><JeffpardyCategory category={ category } jeffpardyBoard={ this } /></div>);

                for (var j: number = 0; j < category.clues.length; j++) {
                    let clue: IClue = category.clues[j];
                    boardGridElements.push(<div className="jeffpardyClue" key={ keyCounter++ } style={ { gridRow: j + 2, gridColumn: i + 1 } }><JeffpardyClue jeffpardyBoard={ this } category={ category } clue={ clue } /></div>);
                }
            }
        }

        return (
            <div id="jeffpardyBoardFrame" >
                <div id="jeffpardyBoardInnerFrame">
                    { this.state.categories &&
                        <div id="jeffpardyBoard">
                            { this.state.activeClue == null &&
                                <div className="jeffpardyBoardClues">
                                    { boardGridElements }
                                </div>
                            }
                            { this.state.activeClue != null &&
                                <div className="jeffpardyActiveClue">
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
