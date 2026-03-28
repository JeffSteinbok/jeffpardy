// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Link } from "@mui/material";

export interface IExcelTemplateDialogProps {
    onLoad: (tsv: string) => void;
    onClose: () => void;
}

interface IExcelTemplateDialogState {
    tsv: string;
}

/** Dialog for loading custom game data by pasting tab-separated content copied from the Excel template. */
export class ExcelTemplateDialog extends React.Component<IExcelTemplateDialogProps, IExcelTemplateDialogState> {
    constructor(props: IExcelTemplateDialogProps) {
        super(props);
        this.state = { tsv: "" };
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
                <DialogTitle>Use Excel Template</DialogTitle>
                <DialogContent
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        flex: 1,
                    }}
                >
                    <Link href="/JeffpardyGameDataTemplate.xlsx" target="#">
                        Download Excel Template
                    </Link>
                    <TextField
                        label="Paste Excel content here."
                        fullWidth
                        multiline
                        minRows={12}
                        sx={{ flex: 1, mt: 1, "& .MuiInputBase-root": { flex: 1, alignItems: "flex-start" } }}
                        onChange={(event) => this.setState({ tsv: event.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.props.onClose} style={{ backgroundColor: "#555", color: "white" }}>
                        Cancel
                    </Button>
                    <Button onClick={() => this.props.onLoad(this.state.tsv)} color="primary">
                        Load
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
