// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { IGameData } from "../Types";
import { JsonEditor } from "../../../components/JsonEditor";

export interface ICustomCategoryDialogProps {
    gameData: IGameData;
    onLoad: (json: string) => void;
    onClose: () => void;
}

interface ICustomCategoryDialogState {
    json: string;
}

/** Dialog for loading custom game data by editing raw JSON with a CodeMirror editor. */
export class CustomCategoryDialog extends React.Component<ICustomCategoryDialogProps, ICustomCategoryDialogState> {
    constructor(props: ICustomCategoryDialogProps) {
        super(props);
        this.state = { json: "" };
    }

    public render() {
        return (
            <Dialog
                open={true}
                keepMounted
                fullWidth
                maxWidth="lg"
                onClose={this.props.onClose}
                PaperProps={{ className: "gameDialog", style: { height: "85vh" } }}
            >
                <DialogTitle>Modify Game Data JSON</DialogTitle>
                <DialogContent
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        paddingBottom: 0,
                        flex: 1,
                    }}
                >
                    <JsonEditor
                        defaultValue={JSON.stringify(
                            this.props.gameData,
                            (key, value) => {
                                if (key == "isAsked") return undefined;
                                else if (key == "isDailyDouble") return undefined;
                                else if (key == "hasDailyDouble") return undefined;
                                else if (key == "value") return undefined;
                                else return value;
                            },
                            4
                        )}
                        onChange={(value) => this.setState({ json: value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.props.onClose} style={{ backgroundColor: "#555", color: "white" }}>
                        Cancel
                    </Button>
                    <Button onClick={() => this.props.onLoad(this.state.json)} color="primary">
                        Load JSON
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
