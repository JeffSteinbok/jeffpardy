// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { TeamDictionary, ITeam } from "../../../Types";
import { JeffpardyHostController } from "../JeffpardyHostController";

export interface ITeamFixupDialogProps {
    teams: TeamDictionary;
    controllingTeam: ITeam;
    jeffpardyHostController: JeffpardyHostController;
    onControllingUserClear: () => void;
    onClose: () => void;
}

/** Dialog for adjusting team scores and the controlling team during gameplay. */
export class TeamFixupDialog extends React.Component<ITeamFixupDialogProps> {
    public render() {
        const { teams, controllingTeam, onClose } = this.props;

        return (
            <Dialog
                open={true}
                keepMounted
                maxWidth="xs"
                onClose={onClose}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.stopPropagation();
                        onClose();
                    }
                }}
                PaperProps={{ className: "gameDialog" }}
            >
                <DialogTitle>Adjust Control &amp; Scores</DialogTitle>
                <DialogContent>
                    <div className="teamFixupHeader">
                        <span className="teamFixupHeaderControl">Control</span>
                        <span className="teamFixupHeaderName">Team</span>
                        <span className="teamFixupHeaderScore">Score</span>
                    </div>
                    {Object.keys(teams)
                        .sort()
                        .map((teamName, index) => {
                            return (
                                <div key={index} className="teamFixupRow">
                                    <input
                                        type="radio"
                                        name="controllingTeamName"
                                        checked={controllingTeam && controllingTeam.name == teamName}
                                        onChange={(_e) => {
                                            this.props.onControllingUserClear();
                                            this.props.jeffpardyHostController.controllingTeamChange(teams[teamName]);
                                        }}
                                    />
                                    <span className="teamFixupName">{teamName}</span>
                                    <input
                                        type="text"
                                        className="teamFixupScore"
                                        defaultValue={teams[teamName].score}
                                        onChange={(e) => (teams[teamName].score = Number.parseInt(e.target.value, 10))}
                                    />
                                </div>
                            );
                        })}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} style={{ backgroundColor: "#555", color: "white" }}>
                        Cancel
                    </Button>
                    <Button onClick={onClose} color="primary" autoFocus>
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
