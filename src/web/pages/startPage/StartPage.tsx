// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { createRoot } from "react-dom/client";
import "../../Jeffpardy.css";
import { Attribution } from "../../components/attribution/Attribution";
/**
 * Root page for the application, begins the rendering.
 */
export class StartPage extends React.Component {
    constructor(props: Record<string, never>) {
        super(props);
    }

    public render() {
        return (
            <div id="startPage">
                <div className="startPageContent">
                    <div className="titleContainer">
                        <img src="/images/JeffpardyTitle.png" className="startPageLogo" />
                    </div>
                    <div className="startPageButtons">
                        <a href="/host" className="startPageButton jeffpardy-label">
                            <span className="buttonLabel">Host a Game</span>
                        </a>
                        <a href="/player" className="startPageButton jeffpardy-label">
                            <span className="buttonLabel">Join a Game</span>
                        </a>
                    </div>
                </div>
                <div className="flexGrowSpacer" />
                <Attribution />
            </div>
        );
    }
}

// Start the application
const root = document.createElement("div");
root.id = "main";
document.body.appendChild(root);
createRoot(document.getElementById("main")!).render(<StartPage />);
