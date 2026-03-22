import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { RoundIntermission } from "./RoundIntermission";

describe("RoundIntermission", () => {
    it("shows Super Jeffpardy content when more rounds remain", () => {
        const onStart = vi.fn();
        const { container } = render(<RoundIntermission round={0} totalNonFinalRounds={2} onStartNewRound={onStart} />);

        expect(container.textContent).toContain("Get ready for...");
        expect(container.querySelector(".title").textContent).toBe("Super");
        expect(container.querySelector(".intermissionTitle")).not.toBeNull();
        expect(container.querySelector("button").textContent).toBe("Start");
    });

    it("calls onStartNewRound when Start button clicked", () => {
        const onStart = vi.fn();
        const { container } = render(<RoundIntermission round={0} totalNonFinalRounds={2} onStartNewRound={onStart} />);

        fireEvent.click(container.querySelector("button"));
        expect(onStart).toHaveBeenCalledTimes(1);
    });

    it("shows Final Jeffpardy content on last round", () => {
        const onStart = vi.fn();
        const { container } = render(<RoundIntermission round={1} totalNonFinalRounds={2} onStartNewRound={onStart} />);

        expect(container.querySelector(".intermissionLogo")).not.toBeNull();
        expect(container.querySelector(".categoryRevealHint").textContent).toContain("SPACE");
        expect(container.querySelector("button")).toBeNull();
    });

    it("renders inside jeffpardyIntermission wrapper", () => {
        const { container } = render(<RoundIntermission round={0} totalNonFinalRounds={2} onStartNewRound={vi.fn()} />);

        expect(container.querySelector(".jeffpardyIntermission")).not.toBeNull();
    });
});
