// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert } from "@mui/material";
import { IGameData } from "../Types";
import { JsonEditor } from "../../../components/JsonEditor";

export interface ICustomCategoryDialogProps {
    gameData: IGameData;
    onLoad: (json: string) => void;
    onClose: () => void;
}

interface ICustomCategoryDialogState {
    json: string;
    loadedJson: string;
    error: string;
}

/** Dialog for loading custom game data by editing raw JSON with a CodeMirror editor. */
export class CustomCategoryDialog extends React.Component<ICustomCategoryDialogProps, ICustomCategoryDialogState> {
    constructor(props: ICustomCategoryDialogProps) {
        super(props);
        this.state = { json: "", loadedJson: null, error: null };
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
                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => {
                                const editorJson =
                                    this.state.json ||
                                    JSON.stringify(
                                        this.props.gameData,
                                        (key, value) => {
                                            if (key == "isAsked") return undefined;
                                            else if (key == "isDailyDouble") return undefined;
                                            else if (key == "hasDailyDouble") return undefined;
                                            else if (key == "value") return undefined;
                                            else return value;
                                        },
                                        4
                                    );
                                const blob = new Blob([editorJson], { type: "application/json" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = "gamedata.json";
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                        >
                            Save to File
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => {
                                const input = document.createElement("input");
                                input.type = "file";
                                input.accept = ".json";
                                input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            const text = ev.target?.result as string;
                                            this.setState({ json: text, loadedJson: text, error: null });
                                        };
                                        reader.readAsText(file);
                                    }
                                };
                                input.click();
                            }}
                        >
                            Load from File
                        </Button>
                    </div>
                    {this.state.error && (
                        <Alert severity="error" sx={{ marginBottom: "8px" }}>
                            {this.state.error}
                        </Alert>
                    )}
                    <JsonEditor
                        defaultValue={
                            this.state.loadedJson ||
                            JSON.stringify(
                                this.props.gameData,
                                (key, value) => {
                                    if (key == "isAsked") return undefined;
                                    else if (key == "isDailyDouble") return undefined;
                                    else if (key == "hasDailyDouble") return undefined;
                                    else if (key == "value") return undefined;
                                    else return value;
                                },
                                4
                            )
                        }
                        onChange={(value) => this.setState({ json: value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.props.onClose} style={{ backgroundColor: "#555", color: "white" }}>
                        Cancel
                    </Button>
                    <Button onClick={() => this.handleOk()} color="primary">
                        Ok
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    private handleOk = () => {
        const json = this.state.json;
        try {
            const data = JSON.parse(json);

            if (!data.rounds || !Array.isArray(data.rounds)) {
                this.setState({ error: "Invalid game data: missing 'rounds' array." });
                return;
            }
            for (let i = 0; i < data.rounds.length; i++) {
                const round = data.rounds[i];
                if (round.id == null) {
                    this.setState({ error: `Invalid game data: round ${i} missing 'id'.` });
                    return;
                }
                if (!round.categories || !Array.isArray(round.categories)) {
                    this.setState({ error: `Invalid game data: round ${i} missing 'categories' array.` });
                    return;
                }
                for (let j = 0; j < round.categories.length; j++) {
                    const cat = round.categories[j];
                    if (!cat.title || !cat.clues || !Array.isArray(cat.clues)) {
                        this.setState({
                            error: `Invalid game data: round ${i}, category ${j} missing 'title' or 'clues'.`,
                        });
                        return;
                    }
                }
            }
            if (!data.finalJeffpardyCategory) {
                this.setState({ error: "Invalid game data: missing 'finalJeffpardyCategory'." });
                return;
            }

            this.setState({ error: null });
            this.props.onLoad(json);
        } catch (e) {
            this.setState({ error: "Invalid JSON: " + (e as Error).message });
        }
    };
}
