import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";
import { GameBoardGrid } from "./GameBoardGrid";
import { ICategory, IClue } from "../../../Types";
import { IJeffpardyBoard } from "./JeffpardyBoard";

function makeClue(overrides: Partial<IClue> = {}): IClue {
    return {
        clue: "Test clue",
        question: "Test question",
        value: 200,
        isAsked: false,
        isDailyDouble: false,
        ...overrides,
    };
}

function makeCategory(overrides: Partial<ICategory> = {}): ICategory {
    return {
        title: "Test Category",
        comment: "",
        airDate: "2024-01-01",
        clues: [makeClue({ value: 200 }), makeClue({ value: 400 })],
        isAsked: false,
        hasDailyDouble: false,
        ...overrides,
    };
}

function makeMockBoard(): IJeffpardyBoard {
    return {
        showClue: vi.fn(),
        showQuestion: vi.fn(),
        showBoard: vi.fn(),
        startTimer: vi.fn(),
        stopTimer: vi.fn(),
        endRound: vi.fn(),
        advanceCategoryReveal: vi.fn(),
        showFinalJeffpardyClue: vi.fn(),
        startFinalJeffpardyTimer: vi.fn(),
    };
}

describe("GameBoardGrid", () => {
    it("renders the correct number of category headers", () => {
        const categories = [makeCategory({ title: "Cat A" }), makeCategory({ title: "Cat B" })];
        const { container } = render(<GameBoardGrid categories={categories} jeffpardyBoard={makeMockBoard()} />);

        const categoryElements = container.querySelectorAll(".jeffpardyCategory");
        expect(categoryElements.length).toBe(2);
    });

    it("renders the correct number of clue cells", () => {
        const categories = [makeCategory(), makeCategory()];
        const { container } = render(<GameBoardGrid categories={categories} jeffpardyBoard={makeMockBoard()} />);

        const clueElements = container.querySelectorAll(".jeffpardyClue");
        // 2 categories × 2 clues each = 4
        expect(clueElements.length).toBe(4);
    });

    it("renders inside a jeffpardyBoardClues container", () => {
        const categories = [makeCategory()];
        const { container } = render(<GameBoardGrid categories={categories} jeffpardyBoard={makeMockBoard()} />);

        expect(container.querySelector(".jeffpardyBoardClues")).not.toBeNull();
    });

    it("assigns correct grid styles to categories", () => {
        const categories = [makeCategory({ title: "A" }), makeCategory({ title: "B" })];
        const { container } = render(<GameBoardGrid categories={categories} jeffpardyBoard={makeMockBoard()} />);

        const cats = container.querySelectorAll(".jeffpardyCategory");
        expect((cats[0] as HTMLElement).style.gridColumn).toBe("1");
        expect((cats[1] as HTMLElement).style.gridColumn).toBe("2");
    });
});
