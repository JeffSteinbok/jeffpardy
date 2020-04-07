import { IJeopardyBoard } from "./components/gameBoard/JeopardyBoard";
import { Logger } from "./utilities/Logger";
import { IScoreboard } from "./components/scoreboard/Scoreboard";
import { WebServerApiManager, IApiExecutionContext } from "./utilities/WebServerApiManager";
import { JeopardyClue } from "./components/gameBoard/JeopardyClue";

export interface IClue {
    clue: string;
    question: string;
    value: number;
    isAsked: boolean;
}

export interface ICategory {
    title: string;
    // Need to change the JSON format to fix this
    questions: IClue[];
    isAsked: boolean;
}

/**
 * This class is to be passed down to pages and components so they can interact with
 * global state in a type-safe manner.
 */
export class JeopardyController {

    jeopardyBoard: IJeopardyBoard;
    scoreboard: IScoreboard;

    public loadCategories() {
        Logger.debug("loadCategories");
        let context: IApiExecutionContext = {
            showProgressIndicator: true,
            apiName: "/api/Categories/GetGameBoard",
            formData: {},
            json: true,
            success: (results: ICategory[]) => {


                let scores: { [key: string]: number } = {};

                results.forEach((category: ICategory) => {
                    for (var i: number = 0; i < category.questions.length; i++) {
                        category.questions[i].value = (i + 1) * 100;
                    }
                });

                this.jeopardyBoard.onCategoriesLoaded(results);
            },
            error: null
        };

        let wsam: WebServerApiManager = new WebServerApiManager();
        wsam.executeApi(context);
    }

    public setJeopardyBoard(board: IJeopardyBoard) {
        this.jeopardyBoard = board;
    }

    public setScoreboard(scoreboard: IScoreboard) {
        this.scoreboard = scoreboard;
    }

    public showClue(clue: IClue) {
        this.scoreboard.onClueShown(clue.value);
    }

    public showQuestion() {
        this.jeopardyBoard.showQuestion();
    }

    public showBoard() {
        this.jeopardyBoard.hideClue();
    }

}
