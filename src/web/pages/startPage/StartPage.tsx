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
                    <img src="/images/JeffpardyTitle.png" className="startPageLogo" />
                    <div className="startPageButtons">
                        <a href="/host" className="startPageButton">
                            <span className="buttonLabel">Host a Game</span>
                        </a>
                        <a href="/player" className="startPageButton">
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
