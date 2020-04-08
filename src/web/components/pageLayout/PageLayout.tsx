import * as React from "react";
import { JeffpardyController } from "../../JeffpardyController";
import { AppTitleBar } from "../appTitleBar/AppTitleBar";
import { JeffpardyBoard, IJeffpardyBoard } from "../gameBoard/JeffpardyBoard";
import { Scoreboard } from "../scoreboard/Scoreboard";
import { Logger } from "../../utilities/Logger";

export interface IPageLayoutState {
}

export class PageLayout extends React.Component<any, IPageLayoutState> {

    jeopardyController: JeffpardyController;

    constructor(props: any) {
        super(props);
        this.jeopardyController = new JeffpardyController();
    }


    public render() {
        return (
            <div className="topPageNormal">
                <div className="topSection">
                </div>
                <div className="middleSection">
                    <div id="pageContent" className="pageContent">
                        <JeffpardyBoard jeopardyController={ this.jeopardyController }></JeffpardyBoard>
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
