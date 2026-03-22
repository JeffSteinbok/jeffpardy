import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { TeamFixupDialog } from "./TeamFixupDialog";
import { TeamDictionary } from "../../../Types";
import { JeffpardyHostController } from "../JeffpardyHostController";

vi.mock("react-dom/client", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-dom/client")>();
    return {
        ...actual,
        createRoot: vi.fn(() => ({ render: vi.fn(), unmount: vi.fn() })),
    };
});

afterEach(() => {
    vi.restoreAllMocks();
});

function makeTeams(): TeamDictionary {
    return {
        Alpha: { name: "Alpha", score: 100, players: [] },
        Beta: { name: "Beta", score: 200, players: [] },
    };
}

function makeMockController(): JeffpardyHostController {
    return {
        controllingTeamChange: vi.fn(),
    } as unknown as JeffpardyHostController;
}

describe("TeamFixupDialog", () => {
    it("renders team names sorted", () => {
        const teams = makeTeams();
        const { baseElement } = render(
            <TeamFixupDialog
                teams={teams}
                controllingTeam={teams["Alpha"]}
                jeffpardyHostController={makeMockController()}
                onControllingUserClear={vi.fn()}
                onClose={vi.fn()}
            />
        );

        const names = baseElement.querySelectorAll(".teamFixupName");
        expect(names.length).toBe(2);
        expect(names[0].textContent).toBe("Alpha");
        expect(names[1].textContent).toBe("Beta");
    });

    it("renders score inputs with current scores", () => {
        const teams = makeTeams();
        const { baseElement } = render(
            <TeamFixupDialog
                teams={teams}
                controllingTeam={teams["Alpha"]}
                jeffpardyHostController={makeMockController()}
                onControllingUserClear={vi.fn()}
                onClose={vi.fn()}
            />
        );

        const scoreInputs = baseElement.querySelectorAll(".teamFixupScore") as NodeListOf<HTMLInputElement>;
        expect(scoreInputs.length).toBe(2);
        expect(scoreInputs[0].defaultValue).toBe("100");
        expect(scoreInputs[1].defaultValue).toBe("200");
    });

    it("calls onClose when Cancel button is clicked", () => {
        const onClose = vi.fn();
        const { baseElement } = render(
            <TeamFixupDialog
                teams={makeTeams()}
                controllingTeam={null}
                jeffpardyHostController={makeMockController()}
                onControllingUserClear={vi.fn()}
                onClose={onClose}
            />
        );

        const buttons = baseElement.querySelectorAll("button");
        const cancelButton = Array.from(buttons).find((b) => b.textContent === "Cancel");
        fireEvent.click(cancelButton);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when OK button is clicked", () => {
        const onClose = vi.fn();
        const { baseElement } = render(
            <TeamFixupDialog
                teams={makeTeams()}
                controllingTeam={null}
                jeffpardyHostController={makeMockController()}
                onControllingUserClear={vi.fn()}
                onClose={onClose}
            />
        );

        const buttons = baseElement.querySelectorAll("button");
        const okButton = Array.from(buttons).find((b) => b.textContent === "OK");
        fireEvent.click(okButton);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("renders the dialog title", () => {
        render(
            <TeamFixupDialog
                teams={makeTeams()}
                controllingTeam={null}
                jeffpardyHostController={makeMockController()}
                onControllingUserClear={vi.fn()}
                onClose={vi.fn()}
            />
        );

        expect(document.body.textContent).toContain("Adjust Control");
        expect(document.body.textContent).toContain("Scores");
    });
});
