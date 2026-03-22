// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { JeffpardyClue } from "./JeffpardyClue";
import { IJeffpardyBoard } from "./JeffpardyBoard";
import { ICategory, IClue } from "../../../Types";

function makeClue(overrides: Partial<IClue> = {}): IClue {
    return {
        clue: "This is a clue",
        question: "What is a question",
        value: 200,
        isAsked: false,
        isDailyDouble: false,
        ...overrides,
    };
}

function makeCategory(clues?: IClue[], overrides: Partial<ICategory> = {}): ICategory {
    return {
        title: "SCIENCE",
        airDate: "2024-01-01",
        comment: "A science category",
        isAsked: false,
        clues: clues || [makeClue()],
        hasDailyDouble: false,
        ...overrides,
    };
}

function makeMockBoard(): Partial<IJeffpardyBoard> {
    return {
        showClue: vi.fn(),
    };
}

describe("JeffpardyClue", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("renders the clue value as a link when clue.isAsked is false", () => {
        const clue = makeClue({ isAsked: false, value: 200 });
        const category = makeCategory([clue]);
        const { container } = render(
            <JeffpardyClue
                style={{}}
                jeffpardyBoard={makeMockBoard() as IJeffpardyBoard}
                category={category}
                clue={clue}
            />
        );
        const link = container.querySelector("a");
        expect(link).toBeInTheDocument();
        expect(link!.textContent).toBe("200");
    });

    it("does not render the link when clue.isAsked is true", () => {
        const clue = makeClue({ isAsked: true });
        const category = makeCategory([clue]);
        const { container } = render(
            <JeffpardyClue
                style={{}}
                jeffpardyBoard={makeMockBoard() as IJeffpardyBoard}
                category={category}
                clue={clue}
            />
        );
        const link = container.querySelector("a");
        expect(link).toBeNull();
    });

    it("clicking the clue calls jeffpardyBoard.showClue with the category and clue", () => {
        const clue = makeClue({ isAsked: false });
        const category = makeCategory([clue]);
        const mockBoard = makeMockBoard();
        const { container } = render(
            <JeffpardyClue style={{}} jeffpardyBoard={mockBoard as IJeffpardyBoard} category={category} clue={clue} />
        );
        const link = container.querySelector("a")!;
        fireEvent.click(link);
        expect(mockBoard.showClue).toHaveBeenCalledWith(category, clue);
    });

    it("clicking the clue sets clue.isAsked to true", () => {
        const clue = makeClue({ isAsked: false });
        const category = makeCategory([clue]);
        const { container } = render(
            <JeffpardyClue
                style={{}}
                jeffpardyBoard={makeMockBoard() as IJeffpardyBoard}
                category={category}
                clue={clue}
            />
        );
        const link = container.querySelector("a")!;
        fireEvent.click(link);
        expect(clue.isAsked).toBe(true);
    });

    it("when all clues in a category are asked, sets category.isAsked to true", () => {
        const clue1 = makeClue({ isAsked: true });
        const clue2 = makeClue({ isAsked: false });
        const category = makeCategory([clue1, clue2]);
        const { container } = render(
            <JeffpardyClue
                style={{}}
                jeffpardyBoard={makeMockBoard() as IJeffpardyBoard}
                category={category}
                clue={clue2}
            />
        );
        const link = container.querySelector("a")!;
        fireEvent.click(link);
        expect(clue2.isAsked).toBe(true);
        expect(category.isAsked).toBe(true);
    });

    it('the div has className "jeffpardyClue"', () => {
        const clue = makeClue();
        const category = makeCategory([clue]);
        const { container } = render(
            <JeffpardyClue
                style={{}}
                jeffpardyBoard={makeMockBoard() as IJeffpardyBoard}
                category={category}
                clue={clue}
            />
        );
        const div = container.querySelector(".jeffpardyClue");
        expect(div).toBeInTheDocument();
    });
});
