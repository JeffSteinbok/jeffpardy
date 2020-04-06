import { IJeopardyBoard } from "./components/gameBoard/JeopardyBoard";
import { Logger } from "./utilities/Logger";
import { IScoreboard } from "./components/scoreboard/Scoreboard";

/**
 * This interface is to be passed down to pages and components so they can interact with
 * global state in a type-safe manner.
 */
export class JeopardyController {

    jeopardyBoard: IJeopardyBoard;
    scoreboard: IScoreboard;

    public setJeopardyBoard(board: IJeopardyBoard) {
        Logger.debug("PageLayout - setJeopardyBoard");
        this.jeopardyBoard = board;
    }

    public setScoreboard(scoreboard: IScoreboard) {
        Logger.debug("PageLayout - setScoreboard");
        this.scoreboard = scoreboard;
    }

    public showClue() {
        this.scoreboard.showClue();
    }

    public hideClue() {
        this.jeopardyBoard.hideClue();
        this.scoreboard.hideClue();
    }

}
