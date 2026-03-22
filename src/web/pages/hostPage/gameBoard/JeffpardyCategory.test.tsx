import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";
import { JeffpardyCategory } from "./JeffpardyCategory";
import { IJeffpardyBoard } from "./JeffpardyBoard";
import { ICategory } from "../../../Types";

function makeCategory(overrides: Partial<ICategory> = {}): ICategory {
    return {
        title: "SCIENCE",
        airDate: "2024-01-01",
        comment: "A science category",
        isAsked: false,
        clues: [],
        hasDailyDouble: false,
        ...overrides,
    };
}

function makeMockBoard(): Partial<IJeffpardyBoard> {
    return {
        showClue: vi.fn(),
    };
}

describe("JeffpardyCategory", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("renders the category title text when category.isAsked is false", () => {
        const category = makeCategory({ isAsked: false });
        const { container } = render(
            <JeffpardyCategory
                style={{}}
                jeffpardyBoard={makeMockBoard() as IJeffpardyBoard}
                category={category}
            />
        );
        expect(container.textContent).toContain("SCIENCE");
    });

    it("does not render the title text when category.isAsked is true", () => {
        const category = makeCategory({ isAsked: true });
        const { container } = render(
            <JeffpardyCategory
                style={{}}
                jeffpardyBoard={makeMockBoard() as IJeffpardyBoard}
                category={category}
            />
        );
        expect(container.textContent).not.toContain("SCIENCE");
    });

    it("applies the style prop to the div", () => {
        const category = makeCategory();
        const style: React.CSSProperties = { backgroundColor: "blue", width: "100px" };
        const { container } = render(
            <JeffpardyCategory
                style={style}
                jeffpardyBoard={makeMockBoard() as IJeffpardyBoard}
                category={category}
            />
        );
        const div = container.querySelector(".jeffpardyCategory") as HTMLElement;
        expect(div.style.backgroundColor).toBe("blue");
        expect(div.style.width).toBe("100px");
    });

    it('the div has className "jeffpardyCategory"', () => {
        const category = makeCategory();
        const { container } = render(
            <JeffpardyCategory
                style={{}}
                jeffpardyBoard={makeMockBoard() as IJeffpardyBoard}
                category={category}
            />
        );
        const div = container.querySelector(".jeffpardyCategory");
        expect(div).toBeInTheDocument();
    });
});
