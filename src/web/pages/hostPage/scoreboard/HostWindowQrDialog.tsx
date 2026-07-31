// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import * as QRCode from "qrcode.react";

export interface IHostWindowQrDialogProps {
    hostSecondaryWindowUri: string;
    onClose: () => void;
}

/** Displays the private secondary host-window link as a QR code during gameplay. */
export class HostWindowQrDialog extends React.Component<IHostWindowQrDialogProps> {
    public render() {
        return (
            <Dialog open={true} maxWidth="xs" onClose={this.props.onClose} PaperProps={{ className: "gameDialog" }}>
                <DialogTitle>Private Host Window</DialogTitle>
                <DialogContent>
                    <div className="hostWindowQr">
                        <QRCode.QRCodeCanvas
                            value={this.props.hostSecondaryWindowUri}
                            size={240}
                            includeMargin={true}
                        />
                        <strong>Do not share this QR code with players.</strong>
                        <span>It opens the private host view containing answers.</span>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.props.onClose} color="primary" autoFocus>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
