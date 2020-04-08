import { IJeffpardyBoard } from "./components/gameBoard/JeffpardyBoard";
import { Logger } from "./utilities/Logger";
import { IScoreboard } from "./components/scoreboard/Scoreboard";
import { WebServerApiManager, IApiExecutionContext } from "./utilities/WebServerApiManager";
import { IHostPage, HostPageViewMode } from "./HostPage";

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
export class JeffpardyHostController {

    hostPage: IHostPage;
    jeffpardyBoard: IJeffpardyBoard;
    scoreboard: IScoreboard;

    categories: ICategory[];

    public loadCategories() {
        Logger.debug("JeffpardyHostController:loadCategories");
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

                this.categories = results;
                this.hostPage.onCategoriesLoaded(this.categories);
            },
            error: null
        };

        let wsam: WebServerApiManager = new WebServerApiManager();
        wsam.executeApi(context);
    }

    public setViewMode(viewMode: HostPageViewMode) {
        this.hostPage.setViewMode(viewMode);
    }

    public setJeffpardyBoard(board: IJeffpardyBoard) {
        this.jeffpardyBoard = board;
    }

    public setScoreboard(scoreboard: IScoreboard) {
        this.scoreboard = scoreboard;
    }

    public showClue(clue: IClue) {
        this.scoreboard.onClueShown(clue.value);
    }

    public showQuestion() {
        this.jeffpardyBoard.showQuestion();
    }

    public showBoard() {
        this.jeffpardyBoard.hideClue();
    }

}
