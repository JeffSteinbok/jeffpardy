import * as React from "react";
import * as ReactDOM from "react-dom";
import * as signalR from "@microsoft/signalr";
import { PageLayout } from "./components/pageLayout/PageLayout";

/**
 * Root page for the application, begins the rendering.
 */
export class Index extends React.Component<any, any> {

    constructor(props: any) {
        super(props);
    }

    public render() {
        return (
            <div>
                <PageLayout />
            </div>
        );
    }
}


// Start the application
let root = document.createElement("div");
root.id = 'main';
document.body.appendChild(root);
ReactDOM.render(
    <Index />,
    document.getElementById("main")
);
