import * as React from "react";
import * as ReactDOM from "react-dom";
import { JeffpardyHostController, ICategory } from "./JeffpardyHostController";
import { AppTitleBar } from "./components/appTitleBar/AppTitleBar";
import { JeffpardyBoard, IJeffpardyBoard } from "./components/gameBoard/JeffpardyBoard";
import { Scoreboard } from "./components/scoreboard/Scoreboard";
import { Logger } from "./utilities/Logger";
import { HostCheatSheet } from "./components/hostCheatSheet/HostCheatSheet";


export enum HostPageViewMode {
    Normal,
    HostCheatSheet
}

export interface IHostPageProps {
}

export interface IHostPageState {
    viewMode: HostPageViewMode;
    categories: ICategory[]
}

export interface IHostPage {
    setViewMode: (viewMode: HostPageViewMode) => void;
    onCategoriesLoaded: (categories: ICategory[]) => void;
}

/**
 * Root page for the host view, begins the rendering.
 */
export class HostPage extends React.Component<any, any> {

    jeffpardyHostController: JeffpardyHostController;

    constructor(props: any) {
        super(props);
        this.jeffpardyHostController = new JeffpardyHostController();
        this.jeffpardyHostController.hostPage = this;

        this.state = {
            viewMode: HostPageViewMode.Normal,
            categories: []
        }
    }

    public componentDidMount() {
        this.jeffpardyHostController.loadCategories();
    }

    public setViewMode = (viewMode: HostPageViewMode) => {
        this.setState({
            viewMode: viewMode
        })
    };

    public onCategoriesLoaded = (categories: ICategory[]) => {
        Logger.debug("PageLayout:onCategoriesLoaded", categories);
        this.setState({ categories: categories })
    }

    public render() {
        Logger.debug("PageLayout:render", this.state.categories);

        let style = {};
        if (this.state.viewMode == HostPageViewMode.HostCheatSheet) {
            style["display"] = "none";
        }

        return (
            <div>
                <div className="topPageNormal" style={ style } >
                    <div className="topSection">
                    </div>
                    <div className="middleSection">
                        <div id="pageContent" className="pageContent">
                            <JeffpardyBoard jeffpardyController={ this.jeffpardyHostController } categories={ this.state.categories }></JeffpardyBoard>
                            <Scoreboard jeffpardyController={ this.jeffpardyHostController } ></Scoreboard>
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
                {
                    this.state.viewMode == HostPageViewMode.HostCheatSheet &&
                    <HostCheatSheet jeffpardyController={ this.jeffpardyHostController } categories={ this.state.categories } />
                }
            </div>
        );
    }
}


// Start the application
let root = document.createElement("div");
root.id = 'main';
document.body.appendChild(root);
ReactDOM.render(
    <HostPage />,
    document.getElementById("main")
);
