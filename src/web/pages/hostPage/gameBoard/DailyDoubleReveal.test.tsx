import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { DailyDoubleReveal } from "./DailyDoubleReveal";
import { ICategory, IClue } from "../../../Types";

function makeClue(overrides: Partial<IClue> = {}): IClue {
    return {
        clue: "Test clue",
        question: "Test question",
        value: 800,
        isAsked: false,
        isDailyDouble: true,
        ...overrides,
    };
}

function makeCategory(overrides: Partial<ICategory> = {}): ICategory {
    return {
        title: "Science",
        comment: "",
        airDate: "2024-01-01",
        clues: [makeClue()],
        isAsked: false,
        hasDailyDouble: true,
        ...overrides,
    };
}

describe("DailyDoubleReveal", () => {
    it("renders the Daily Double image", () => {
        const { container } = render(
            <DailyDoubleReveal
                activeCategory={makeCategory()}
                activeClue={makeClue()}
                dailyDoubleMaxBet={1000}
                dailyDoubleRevealed={false}
                wagerError={null}
                onWagerInputChange={vi.fn()}
                onSubmitWager={vi.fn()}
            />
        );

        const img = container.querySelector(".dailyDoubleImage");
        expect(img).not.toBeNull();
        expect(img.getAttribute("src")).toBe("/images/DailyDouble.jpg");
    });

    it("adds faded class when revealed", () => {
        const { container } = render(
            <DailyDoubleReveal
                activeCategory={makeCategory()}
                activeClue={makeClue()}
                dailyDoubleMaxBet={1000}
                dailyDoubleRevealed={true}
                wagerError={null}
                onWagerInputChange={vi.fn()}
                onSubmitWager={vi.fn()}
            />
        );

        expect(container.querySelector(".dailyDoubleImage").classList.contains("faded")).toBe(true);
    });

    it("shows content when revealed", () => {
        const { container } = render(
            <DailyDoubleReveal
                activeCategory={makeCategory()}
                activeClue={makeClue()}
                dailyDoubleMaxBet={1000}
                dailyDoubleRevealed={true}
                wagerError={null}
                onWagerInputChange={vi.fn()}
                onSubmitWager={vi.fn()}
            />
        );

        expect(container.querySelector(".dailyDoubleContent").classList.contains("visible")).toBe(true);
        expect(container.querySelector(".title").textContent).toBe("Daily Double!");
    });

    it("displays wager error when provided", () => {
        const { container } = render(
            <DailyDoubleReveal
                activeCategory={makeCategory()}
                activeClue={makeClue()}
                dailyDoubleMaxBet={1000}
                dailyDoubleRevealed={true}
                wagerError="Please enter a wager between 0 and 1000."
                onWagerInputChange={vi.fn()}
                onSubmitWager={vi.fn()}
            />
        );

        const errorEl = container.querySelector(".wagerError");
        expect(errorEl).not.toBeNull();
        expect(errorEl.textContent).toContain("1000");
    });

    it("calls onWagerInputChange when input changes", () => {
        const onChange = vi.fn();
        const { container } = render(
            <DailyDoubleReveal
                activeCategory={makeCategory()}
                activeClue={makeClue()}
                dailyDoubleMaxBet={1000}
                dailyDoubleRevealed={true}
                wagerError={null}
                onWagerInputChange={onChange}
                onSubmitWager={vi.fn()}
            />
        );

        const input = container.querySelector("input[type='number']") as HTMLInputElement;
        fireEvent.change(input, { target: { value: "500" } });
        expect(onChange).toHaveBeenCalledWith("500");
    });

    it("calls onSubmitWager when submit button clicked", () => {
        const onSubmit = vi.fn();
        const { container } = render(
            <DailyDoubleReveal
                activeCategory={makeCategory()}
                activeClue={makeClue()}
                dailyDoubleMaxBet={1000}
                dailyDoubleRevealed={true}
                wagerError={null}
                onWagerInputChange={vi.fn()}
                onSubmitWager={onSubmit}
            />
        );

        const button = container.querySelector("button");
        fireEvent.click(button);
        expect(onSubmit).toHaveBeenCalledWith(1000);
    });

    it("shows max bet hint", () => {
        const { container } = render(
            <DailyDoubleReveal
                activeCategory={makeCategory()}
                activeClue={makeClue()}
                dailyDoubleMaxBet={2000}
                dailyDoubleRevealed={true}
                wagerError={null}
                onWagerInputChange={vi.fn()}
                onSubmitWager={vi.fn()}
            />
        );

        const hint = container.querySelector(".wagerHint");
        expect(hint.textContent).toContain("2000");
    });
});
