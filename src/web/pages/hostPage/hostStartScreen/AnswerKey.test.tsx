import { describe, it, expect, vi, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import * as React from "react";
import { AnswerKey } from "./AnswerKey";
import { IGameData } from "../Types";

const mockGameData: IGameData = {
    rounds: [
        {
            id: 0,
            name: "Jeffpardy",
            categories: [
                {
                    title: "TEST CAT",
                    airDate: "2024-01-15T00:00:00",
                    comment: "Test comment",
                    isAsked: false,
                    hasDailyDouble: false,
                    clues: [
                        {
                            clue: "Test clue 1",
                            question: "Test question 1",
                            value: 200,
                            isAsked: false,
                            isDailyDouble: false,
                        },
                        {
                            clue: "Test clue 2",
                            question: "Test question 2",
                            value: 400,
                            isAsked: false,
                            isDailyDouble: true,
                        },
                    ],
                },
            ],
        },
    ],
    finalJeffpardyCategory: {
        title: "FINAL CAT",
        airDate: "2024-01-15T00:00:00",
        comment: "Final comment",
        isAsked: false,
        hasDailyDouble: false,
        clues: [{ clue: "Final clue", question: "Final answer", value: 0, isAsked: false, isDailyDouble: false }],
    },
};

describe("AnswerKey", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("renders round names from gameData.rounds", () => {
        const { container } = render(<AnswerKey gameData={mockGameData} onHide={vi.fn()} />);
        const h1s = container.querySelectorAll("h1");
        const texts = Array.from(h1s).map((el) => el.textContent);
        expect(texts).toContain("Jeffpardy");
    });

    it("renders category titles for each round", () => {
        const { container } = render(<AnswerKey gameData={mockGameData} onHide={vi.fn()} />);
        const titles = container.querySelectorAll(".answerKeyCategory .title");
        expect(titles.length).toBeGreaterThanOrEqual(1);
        expect(titles[0].textContent).toBe("TEST CAT");
    });

    it("renders clue values and text", () => {
        const { container } = render(<AnswerKey gameData={mockGameData} onHide={vi.fn()} />);
        const values = container.querySelectorAll(".answerKeyClue .value");
        expect(values.length).toBe(2);
        expect(values[0].textContent).toContain("200");
        expect(values[1].textContent).toContain("400");

        const clues = container.querySelectorAll(".answerKeyClue .clue");
        expect(clues[0].textContent).toContain("Test clue 1");
    });

    it('shows " - DD" for daily double clues', () => {
        const { container } = render(<AnswerKey gameData={mockGameData} onHide={vi.fn()} />);
        const values = container.querySelectorAll(".answerKeyClue .value");
        expect(values[0].textContent).not.toContain("DD");
        expect(values[1].textContent).toContain(" - DD");
    });

    it("pressing ESC calls onHide", () => {
        const onHide = vi.fn();
        render(<AnswerKey gameData={mockGameData} onHide={onHide} />);

        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 27 }));
        });

        expect(onHide).toHaveBeenCalledTimes(1);
    });

    it("renders final Jeffpardy category title and clue", () => {
        const { container } = render(<AnswerKey gameData={mockGameData} onHide={vi.fn()} />);
        const h1s = container.querySelectorAll("h1");
        const finalH1 = Array.from(h1s).find((el) => el.textContent === "Final Jeffpardy");
        expect(finalH1).toBeInTheDocument();

        const allTitles = container.querySelectorAll(".title");
        const finalTitle = Array.from(allTitles).find((el) => el.textContent === "FINAL CAT");
        expect(finalTitle).toBeInTheDocument();

        expect(container.textContent).toContain("Final clue");
        expect(container.textContent).toContain("Final answer");
    });

    it("adds keydown listener on mount and removes on unmount", () => {
        const addSpy = vi.spyOn(window, "addEventListener");
        const removeSpy = vi.spyOn(window, "removeEventListener");

        const { unmount } = render(<AnswerKey gameData={mockGameData} onHide={vi.fn()} />);

        expect(addSpy).toHaveBeenCalledWith("keydown", expect.any(Function));

        unmount();

        expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    });
});
