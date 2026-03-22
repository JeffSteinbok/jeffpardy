// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

export interface IEndRoundDialogProps {
    onConfirm: () => void;
    onClose: () => void;
}

/** Confirmation dialog that prompts the host before forcibly ending the current round. */
export class EndRoundDialog extends React.Component<IEndRoundDialogProps> {
    public render() {
        return (
            <Dialog open={true} onClose={this.props.onClose} PaperProps={{ className: "gameDialog" }}>
                <DialogTitle>End Round</DialogTitle>
                <DialogContent>Are you sure you want to end the current round?</DialogContent>
                <DialogActions>
                    <Button onClick={this.props.onClose} style={{ backgroundColor: "#555", color: "white" }}>
                        Cancel
                    </Button>
                    <Button onClick={this.props.onConfirm} color="primary" autoFocus>
                        End Round
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
