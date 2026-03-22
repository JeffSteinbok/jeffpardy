import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

export interface IEndRoundDialogProps {
    onConfirm: () => void;
    onClose: () => void;
}

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
