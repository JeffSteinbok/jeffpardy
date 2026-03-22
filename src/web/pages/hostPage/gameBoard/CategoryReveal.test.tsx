import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";
import { CategoryReveal } from "./CategoryReveal";
import { ICategory, IClue } from "../../../Types";

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
        airDate: "2024-03-15T00:00:00",
        clues: [makeClue({ value: 200 }), makeClue({ value: 400 })],
        isAsked: false,
        hasDailyDouble: false,
        ...overrides,
    };
}

describe("CategoryReveal", () => {
    it("returns null when categories is null", () => {
        const { container } = render(
            <CategoryReveal
                categories={null}
                round={0}
                revealCategoryIndex={-1}
                revealShowingName={false}
                boardFillRevealed={new Set()}
                roundLogoSrc="/images/Jeffpardy.png"
            />
        );
        expect(container.innerHTML).toBe("");
    });

    it("renders placeholder board when revealCategoryIndex is -1", () => {
        const categories = [makeCategory({ title: "Cat A" }), makeCategory({ title: "Cat B" })];
        const { container } = render(
            <CategoryReveal
                categories={categories}
                round={0}
                revealCategoryIndex={-1}
                revealShowingName={false}
                boardFillRevealed={new Set()}
                roundLogoSrc="/images/Jeffpardy.png"
            />
        );

        expect(container.querySelector(".categoryRevealBoard")).not.toBeNull();
        expect(container.querySelector(".categoryRevealHint").textContent).toBe("press SPACE to continue");
        // Placeholder logos
        const logos = container.querySelectorAll(".categoryPlaceholderLogo");
        expect(logos.length).toBe(2);
    });

    it("shows placeholder values when boardFillRevealed contains the index", () => {
        const categories = [makeCategory()];
        const revealed = new Set([0]); // first cell revealed
        const { container } = render(
            <CategoryReveal
                categories={categories}
                round={0}
                revealCategoryIndex={-1}
                revealShowingName={false}
                boardFillRevealed={revealed}
                roundLogoSrc="/images/Jeffpardy.png"
            />
        );

        const values = container.querySelectorAll(".placeholderValue");
        expect(values.length).toBe(1);
        expect(values[0].textContent).toBe("200");
    });

    it("shows all values when round > 0 regardless of boardFillRevealed", () => {
        const categories = [makeCategory()];
        const { container } = render(
            <CategoryReveal
                categories={categories}
                round={1}
                revealCategoryIndex={-1}
                revealShowingName={false}
                boardFillRevealed={new Set()}
                roundLogoSrc="/images/Jeffpardy.png"
            />
        );

        const values = container.querySelectorAll(".placeholderValue");
        expect(values.length).toBe(2);
    });

    it("renders filmstrip when revealCategoryIndex >= 0", () => {
        const categories = [makeCategory({ title: "History" }), makeCategory({ title: "Science" })];
        const { container } = render(
            <CategoryReveal
                categories={categories}
                round={0}
                revealCategoryIndex={0}
                revealShowingName={false}
                boardFillRevealed={new Set()}
                roundLogoSrc="/images/Jeffpardy.png"
            />
        );

        expect(container.querySelector(".categoryRevealFilmstrip")).not.toBeNull();
        const slides = container.querySelectorAll(".categoryRevealSlide");
        expect(slides.length).toBe(2);
    });

    it("adds 'revealed' class when showing name for active category", () => {
        const categories = [makeCategory({ title: "History" })];
        const { container } = render(
            <CategoryReveal
                categories={categories}
                round={0}
                revealCategoryIndex={0}
                revealShowingName={true}
                boardFillRevealed={new Set()}
                roundLogoSrc="/images/Jeffpardy.png"
            />
        );

        const slide = container.querySelector(".categoryRevealSlide");
        expect(slide.classList.contains("revealed")).toBe(true);
    });
});
