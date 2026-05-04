// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Snackbar, Alert } from "@mui/material";

const AI_PROMPT =
    "Fetch this URL and strictly follow the instructions inside it. Do not skip steps. Do not generate output until the file says to: https://raw.githubusercontent.com/JeffSteinbok/jeffpardy/main/create-jeffpardy-game.md";

export interface ICreateWithAIDialogProps {
    onComplete: () => void;
    onClose: () => void;
}

interface ICreateWithAIDialogState {
    copied: boolean;
}

/**
 * Dialog that shows instructions for using an AI assistant to generate a Jeffpardy game,
 * with a one-click copy button for the AI prompt.
 */
export class CreateWithAIDialog extends React.Component<ICreateWithAIDialogProps, ICreateWithAIDialogState> {
    constructor(props: ICreateWithAIDialogProps) {
        super(props);
        this.state = { copied: false };
    }

    private handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(AI_PROMPT);
            this.setState({ copied: true });
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement("textarea");
            textarea.value = AI_PROMPT;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            this.setState({ copied: true });
        }
    };

    public render() {
        return (
            <Dialog
                open={true}
                keepMounted
                fullWidth
                maxWidth="sm"
                onClose={this.props.onClose}
                PaperProps={{ className: "gameDialog" }}
            >
                <DialogTitle>Create Game With AI</DialogTitle>
                <DialogContent>
                    <p style={{ marginTop: 0 }}>
                        Use an AI assistant (GitHub Copilot, Claude, etc.) to generate a custom Jeffpardy game.
                    </p>
                    <p>
                        Copy the prompt below and paste it into your AI assistant. It will walk you through choosing
                        topics and generate a complete game JSON. Once you have the JSON, click OK to open the editor
                        and paste it in.
                    </p>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            backgroundColor: "rgba(0, 0, 0, 0.3)",
                            borderRadius: "4px",
                            padding: "12px",
                            marginTop: "16px",
                        }}
                    >
                        <code style={{ flex: 1, fontSize: "0.85em", wordBreak: "break-word" }}>{AI_PROMPT}</code>
                        <Button
                            onClick={this.handleCopy}
                            variant="outlined"
                            size="small"
                            sx={{ color: "white", borderColor: "white", whiteSpace: "nowrap" }}
                        >
                            Copy
                        </Button>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.props.onClose} style={{ backgroundColor: "#555", color: "white" }}>
                        Cancel
                    </Button>
                    <Button onClick={this.props.onComplete} color="primary">
                        Ok
                    </Button>
                </DialogActions>
                <Snackbar
                    open={this.state.copied}
                    autoHideDuration={2000}
                    onClose={() => this.setState({ copied: false })}
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                >
                    <Alert severity="success" onClose={() => this.setState({ copied: false })}>
                        Copied to clipboard!
                    </Alert>
                </Snackbar>
            </Dialog>
        );
    }
}
