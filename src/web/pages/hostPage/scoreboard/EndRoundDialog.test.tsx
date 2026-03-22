import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { EndRoundDialog } from "./EndRoundDialog";

vi.mock("react-dom/client", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-dom/client")>();
    return {
        ...actual,
        createRoot: vi.fn(() => ({ render: vi.fn(), unmount: vi.fn() })),
    };
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("EndRoundDialog", () => {
    it("renders confirmation text", () => {
        render(<EndRoundDialog onConfirm={vi.fn()} onClose={vi.fn()} />);

        expect(document.body.textContent).toContain("Are you sure you want to end the current round?");
    });

    it("renders End Round title", () => {
        render(<EndRoundDialog onConfirm={vi.fn()} onClose={vi.fn()} />);

        expect(document.body.textContent).toContain("End Round");
    });

    it("calls onConfirm when End Round button clicked", () => {
        const onConfirm = vi.fn();
        const { baseElement } = render(<EndRoundDialog onConfirm={onConfirm} onClose={vi.fn()} />);

        const buttons = baseElement.querySelectorAll("button");
        const endRoundButton = Array.from(buttons).find((b) => b.textContent === "End Round");
        fireEvent.click(endRoundButton);
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when Cancel button clicked", () => {
        const onClose = vi.fn();
        const { baseElement } = render(<EndRoundDialog onConfirm={vi.fn()} onClose={onClose} />);

        const buttons = baseElement.querySelectorAll("button");
        const cancelButton = Array.from(buttons).find((b) => b.textContent === "Cancel");
        fireEvent.click(cancelButton);
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
