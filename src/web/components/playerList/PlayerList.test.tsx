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

    it("renders scores as plain numbers without commas", () => {
        const teams = makeTeams();
        const scores = { Alpha: 1234567, Beta: 500 };
        const { container } = render(<PlayerList teams={teams} scores={scores} />);
        const scoreSpans = container.querySelectorAll(".teamScore");
        const scoreTexts = Array.from(scoreSpans).map((el) => el.textContent);
        // Should NOT contain commas (no toLocaleString formatting)
        expect(scoreTexts.some((t) => t.includes(","))).toBe(false);
        expect(scoreTexts.some((t) => t.includes("1234567"))).toBe(true);
        expect(scoreTexts.some((t) => t.includes("500"))).toBe(true);
    });

    it("renders scores without $ prefix", () => {
        const teams = makeTeams();
        const scores = { Alpha: 200, Beta: 100 };
        const { container } = render(<PlayerList teams={teams} scores={scores} />);
        const scoreSpans = container.querySelectorAll(".teamScore");
        const scoreTexts = Array.from(scoreSpans).map((el) => el.textContent);
        expect(scoreTexts.some((t) => t.includes("$"))).toBe(false);
    });

    it("does not render scores when scores prop is omitted", () => {
        const { container } = render(<PlayerList teams={makeTeams()} />);
        const scoreSpans = container.querySelectorAll(".teamScore");
        expect(scoreSpans.length).toBe(0);
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
