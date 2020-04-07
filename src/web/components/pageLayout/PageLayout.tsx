import * as React from "react";
import { JeopardyController } from "../../JeopardyController";
import { AppTitleBar } from "../appTitleBar/AppTitleBar";
import { JeopardyBoard, IJeopardyBoard } from "../gameBoard/JeopardyBoard";
import { Scoreboard } from "../scoreboard/Scoreboard";
import { Logger } from "../../utilities/Logger";

export interface IPageLayoutState {
}

export class PageLayout extends React.Component<any, IPageLayoutState> {

    jeopardyController: JeopardyController;

    constructor(props: any) {
        super(props);
        this.jeopardyController = new JeopardyController();
    }


    public render() {
        return (
            <div className="topPageNormal">
                <div className="topSection">
                </div>
                <div className="middleSection">
                    <div id="pageContent" className="pageContent">
                        <JeopardyBoard jeopardyController={ this.jeopardyController }></JeopardyBoard>
                        <Scoreboard jeopardyController={ this.jeopardyController } ></Scoreboard>
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
