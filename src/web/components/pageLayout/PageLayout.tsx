import * as React from "react";
import { IJeopardyController } from "../../IJeopardyController";
import { AppTitleBar } from "../appTitleBar/AppTitleBar";
import { JeopardyBoard } from "../gameBoard/JeopardyBoard";
import { Scoreboard } from "../scoreboard/Scoreboard";

export interface IPageLayoutState {
}

export class PageLayout extends React.Component<any, IPageLayoutState> implements IJeopardyController {
    public render() {
        return (
            <div className="topPageNormal">
                <div className="topSection">
                </div>
                <div className="middleSection">
                    <div id="pageContent" className="pageContent">
                        <JeopardyBoard></JeopardyBoard>
                        <Scoreboard></Scoreboard>
                    </div>
                </div>
                <div className="bottomSection">
                    <table id="footerTable">
                        <tbody>
                            <tr>
                                <td id="footer_left" className="footerCell resetWidth">
                                    <ul>
                                        <li><span>&copy; 2020 Jeff Steinbok</span></li>
                                    </ul>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}
