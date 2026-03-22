// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";
import { ClueDisplay } from "./ClueDisplay";
import { ICategory, IClue } from "../../../Types";

function makeClue(overrides: Partial<IClue> = {}): IClue {
    return {
        clue: "This president served two terms.",
        question: "Who is Washington?",
        value: 400,
        isAsked: false,
        isDailyDouble: false,
        ...overrides,
    };
}

function makeCategory(overrides: Partial<ICategory> = {}): ICategory {
    return {
        title: "US Presidents",
        comment: "",
        airDate: "2024-01-01",
        clues: [makeClue()],
        isAsked: false,
        hasDailyDouble: false,
        ...overrides,
    };
}

describe("ClueDisplay", () => {
    it("renders category title and value in header", () => {
        const { container } = render(
            <ClueDisplay
                activeCategory={makeCategory({ title: "History" })}
                activeClue={makeClue({ value: 600 })}
                showQuestion={false}
                timerPercentageRemaining={1}
            />
        );

        const header = container.querySelector(".header");
        expect(header.textContent).toBe("History for 600");
    });

    it("renders clue text", () => {
        const { container } = render(
            <ClueDisplay
                activeCategory={makeCategory()}
                activeClue={makeClue({ clue: "A famous clue" })}
                showQuestion={false}
                timerPercentageRemaining={1}
            />
        );

        const clueEl = container.querySelector(".clue");
        expect(clueEl.textContent).toContain("A famous clue");
    });

    it("shows non-breaking space when showQuestion is false", () => {
        const { container } = render(
            <ClueDisplay
                activeCategory={makeCategory()}
                activeClue={makeClue({ question: "Who is nobody?" })}
                showQuestion={false}
                timerPercentageRemaining={1}
            />
        );

        const questionEl = container.querySelector(".question");
        expect(questionEl.textContent).toBe("\u00A0");
    });

    it("shows question text when showQuestion is true", () => {
        const { container } = render(
            <ClueDisplay
                activeCategory={makeCategory()}
                activeClue={makeClue({ question: "Who is Lincoln?" })}
                showQuestion={true}
                timerPercentageRemaining={1}
            />
        );

        const questionEl = container.querySelector(".question");
        expect(questionEl.textContent).toContain("Who is Lincoln?");
    });

    it("renders the timer component", () => {
        const { container } = render(
            <ClueDisplay
                activeCategory={makeCategory()}
                activeClue={makeClue()}
                showQuestion={false}
                timerPercentageRemaining={0.5}
            />
        );

        expect(container.querySelector(".timer")).not.toBeNull();
    });
});
