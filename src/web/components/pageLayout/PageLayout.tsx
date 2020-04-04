import * as React from "react";
import { IJeopardyController } from "../../IJeopardyController";
import { AppTitleBar } from "../appTitleBar/AppTitleBar";
import { JeopardyBoard } from "../gameBoard/JeopardyBoard";

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
                    </div>
                </div>
                <div className="bottomSection">
                    <table id="footerTable">
                        <tbody>
                            <tr>
                                <td id="footer_left" className="footerCell resetWidth">
                                    <ul>
                                        <li><span>&copy; 2017 Microsoft</span></li>
                                        <li><span>Confidential</span></li>
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
