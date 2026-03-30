// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import * as React from "react";

// Mock createRoot to prevent module-level mount side effects
vi.mock("react-dom/client", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-dom/client")>();
    return {
        ...actual,
        createRoot: vi.fn(() => ({ render: vi.fn(), unmount: vi.fn() })),
    };
});

import { FinalJeffpardyTally } from "./FinalJeffpardyTally";
import { TeamDictionary } from "../../../Types";
import { FinalJeffpardyWagerDictionary, FinalJeffpardyAnswerDictionary } from "../Types";

vi.restoreAllMocks();

function makeTeams(): TeamDictionary {
    return {
        Alpha: {
            name: "Alpha",
            score: 200,
            players: [{ name: "Alice", team: "Alpha", connectionId: "c1" }],
        },
        Beta: {
            name: "Beta",
            score: 100,
            players: [{ name: "Bob", team: "Beta", connectionId: "c2" }],
        },
    };
}

function makeWagers(): FinalJeffpardyWagerDictionary {
    return { c1: 50, c2: 80 };
}

function makeAnswers(): FinalJeffpardyAnswerDictionary {
    return {
        c1: { answer: "Paris", responseTime: 5 },
        c2: { answer: "London", responseTime: 3 },
    };
}

describe("FinalJeffpardyTally", () => {
    it("renders the current team name", () => {
        const { container } = render(
            <FinalJeffpardyTally
                teams={makeTeams()}
                wagers={makeWagers()}
                answers={makeAnswers()}
                onScoreChange={vi.fn()}
                onBroadcastScores={vi.fn()}
                onTallyCompleted={vi.fn()}
            />
        );
        // Lowest score team (Beta) shows first
        const teamName = container.querySelector(".tallyTeamName");
        expect(teamName).toBeInTheDocument();
        expect(teamName!.textContent).toBe("Beta");
    });

    it("shows one team at a time (single card)", () => {
        const { container } = render(
            <FinalJeffpardyTally
                teams={makeTeams()}
                wagers={makeWagers()}
                answers={makeAnswers()}
                onScoreChange={vi.fn()}
                onBroadcastScores={vi.fn()}
                onTallyCompleted={vi.fn()}
            />
        );
        const cards = container.querySelectorAll(".tallyTeamCard");
        expect(cards.length).toBe(1);
    });

    it('shows "HIT SPACE TO REVEAL RESPONSES" hint initially', () => {
        const { container } = render(
            <FinalJeffpardyTally
                teams={makeTeams()}
                wagers={makeWagers()}
                answers={makeAnswers()}
                onScoreChange={vi.fn()}
                onBroadcastScores={vi.fn()}
                onTallyCompleted={vi.fn()}
            />
        );
        const hint = container.querySelector(".categoryRevealHint");
        expect(hint).toBeInTheDocument();
        expect(hint!.textContent).toBe("HIT SPACE TO REVEAL RESPONSES");
    });

    it("shows ✓ and ✗ buttons after enough reveals for the current team", () => {
        const teams: TeamDictionary = {
            Solo: {
                name: "Solo",
                score: 100,
                players: [{ name: "Sam", team: "Solo", connectionId: "s1" }],
            },
        };
        const wagers: FinalJeffpardyWagerDictionary = { s1: 50 };
        const answers: FinalJeffpardyAnswerDictionary = {
            s1: { answer: "Answer", responseTime: 2 },
        };

        const { container } = render(
            <FinalJeffpardyTally
                teams={teams}
                wagers={wagers}
                answers={answers}
                onScoreChange={vi.fn()}
                onBroadcastScores={vi.fn()}
                onTallyCompleted={vi.fn()}
            />
        );

        // 1 player × 2 reveal steps needed; simulate by pressing space twice
        const space = () => new KeyboardEvent("keydown", { key: " " });
        act(() => {
            window.dispatchEvent(space());
        });
        act(() => {
            window.dispatchEvent(space());
        });

        const buttons = container.querySelectorAll(".tallyAction button");
        expect(buttons.length).toBe(2);
        expect(buttons[0].textContent).toBe("✓ Correct");
        expect(buttons[1].textContent).toBe("✗ Incorrect");
    });

    it("renders nothing when there are no teams", () => {
        const { container } = render(
            <FinalJeffpardyTally
                teams={{}}
                wagers={{}}
                answers={{}}
                onScoreChange={vi.fn()}
                onBroadcastScores={vi.fn()}
                onTallyCompleted={vi.fn()}
            />
        );
        const card = container.querySelector(".tallyTeamCard");
        expect(card).toBeNull();
    });
});
