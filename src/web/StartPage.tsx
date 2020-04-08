import * as React from "react";
import * as ReactDOM from "react-dom";
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
                <div><a href="/host">Host a Game</a></div>
                <div><a href="/player">Join a Game as a Player</a></div>
            </div>
        );
    }
}


// Start the application
let root = document.createElement("div");
root.id = 'main';
document.body.appendChild(root);
ReactDOM.render(
    <StartPage />,
    document.getElementById("main")
);
