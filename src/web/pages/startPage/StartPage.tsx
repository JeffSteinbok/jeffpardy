import * as React from "react";
import { createRoot } from "react-dom/client";
import "../../Jeffpardy.scss";
import { Attribution } from "../../components/attribution/Attribution";
/**
 * Root page for the application, begins the rendering.
 */
export class StartPage extends React.Component<any, any> {

    constructor(props: any) {
        super(props);
    }

    public render() {
        return (
            <div id="startPage">
                <div className="title">Jeffpardy!</div>
                <div className="linkList">
                    <a href="/host">Host a Game</a>&nbsp;|&nbsp;<a href="/player">Join a Game</a>
                </div>
                <div className="flexGrowSpacer" />
                <Attribution />
            </div>
        );
    }
}


// Start the application
let root = document.createElement("div");
root.id = 'main';
document.body.appendChild(root);
createRoot(document.getElementById("main")!).render(
    <StartPage />
);
