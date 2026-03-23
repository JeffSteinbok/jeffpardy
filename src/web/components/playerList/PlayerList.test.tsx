// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";

// Mock createRoot to prevent module-level mount side effects
vi.mock("react-dom/client", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-dom/client")>();
    return {
        ...actual,
        createRoot: vi.fn(() => ({ render: vi.fn(), unmount: vi.fn() })),
    };
});

import { PlayerList } from "./PlayerList";
import { TeamDictionary } from "../../Types";

vi.restoreAllMocks();

function makeTeams(): TeamDictionary {
    return {
        Alpha: {
            name: "Alpha",
            score: 200,
            players: [
                { name: "Alice", team: "Alpha", connectionId: "c1" },
                { name: "Anna", team: "Alpha", connectionId: "c3" },
            ],
        },
        Beta: {
            name: "Beta",
            score: 100,
            players: [{ name: "Bob", team: "Beta", connectionId: "c2" }],
        },
    };
}

describe("PlayerList", () => {
    describe("lobby mode (no scores)", () => {
        it("renders team names", () => {
            const { container } = render(<PlayerList teams={makeTeams()} />);
            const items = container.querySelectorAll(".playerList > li");
            const text = Array.from(items).map((li) => li.textContent);
            expect(text.some((t) => t.includes("Alpha"))).toBe(true);
            expect(text.some((t) => t.includes("Beta"))).toBe(true);
        });

        it("renders player names under teams", () => {
            const { container } = render(<PlayerList teams={makeTeams()} />);
            const playerItems = container.querySelectorAll(".playerList > li > ul > li");
            const names = Array.from(playerItems).map((li) => li.textContent!.trim());
            expect(names).toContain("Alice");
            expect(names).toContain("Anna");
            expect(names).toContain("Bob");
        });

        it("does not render score table when scores prop is omitted", () => {
            const { container } = render(<PlayerList teams={makeTeams()} />);
            expect(container.querySelector(".playerScoreTable")).toBeNull();
            expect(container.querySelector(".playerList")).not.toBeNull();
        });

        it("shows lock indicator for locked-in players", () => {
            const teams = makeTeams();
            const { container } = render(<PlayerList teams={teams} lockedInPlayerIds={["c1"]} />);
            const lockedItems = container.querySelectorAll(".lockedIn");
            expect(lockedItems.length).toBe(1);
            expect(lockedItems[0].textContent).toContain("Alice");
            expect(lockedItems[0].textContent).toContain("🔒");
        });
    });

    describe("score table mode (with scores)", () => {
        it("renders as a table when scores are provided", () => {
            const teams = makeTeams();
            const scores = { Alpha: 200, Beta: 100 };
            const { container } = render(<PlayerList teams={teams} scores={scores} />);
            expect(container.querySelector(".playerScoreTable")).not.toBeNull();
            expect(container.querySelector(".playerList")).toBeNull();
        });

        it("sorts teams by score descending", () => {
            const teams = makeTeams();
            const scores = { Alpha: 100, Beta: 500 };
            const { container } = render(<PlayerList teams={teams} scores={scores} />);
            const rows = container.querySelectorAll(".playerScoreTable tbody tr");
            const teamNames = Array.from(rows).map((r) => r.querySelector(".teamNameCol")!.textContent);
            expect(teamNames).toEqual(["Beta", "Alpha"]);
        });

        it("renders scores as plain numbers without commas or $", () => {
            const teams = makeTeams();
            const scores = { Alpha: 1234567, Beta: 500 };
            const { container } = render(<PlayerList teams={teams} scores={scores} />);
            const scoreCells = container.querySelectorAll("td.scoreCol");
            const texts = Array.from(scoreCells).map((el) => el.textContent);
            expect(texts.some((t) => t.includes(","))).toBe(false);
            expect(texts.some((t) => t.includes("$"))).toBe(false);
            expect(texts.some((t) => t.includes("1234567"))).toBe(true);
        });

        it("applies negative class for negative scores", () => {
            const teams = makeTeams();
            const scores = { Alpha: -200, Beta: 100 };
            const { container } = render(<PlayerList teams={teams} scores={scores} />);
            const negativeCells = container.querySelectorAll(".scoreCol.negative");
            expect(negativeCells.length).toBe(1);
            expect(negativeCells[0].textContent).toContain("-200");
        });

        it("shows only team names, not player names", () => {
            const teams = makeTeams();
            const scores = { Alpha: 200, Beta: 100 };
            const { container } = render(<PlayerList teams={teams} scores={scores} />);
            const tableText = container.querySelector(".playerScoreTable")!.textContent;
            expect(tableText).toContain("Alpha");
            expect(tableText).toContain("Beta");
            expect(tableText).not.toContain("Alice");
            expect(tableText).not.toContain("Bob");
        });
    });
});
