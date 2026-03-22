import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import * as React from "react";
import { ScreenSizeWarning } from "./ScreenSizeWarning";

describe("ScreenSizeWarning", () => {
    let resizeHandler: (() => void) | null = null;

    beforeEach(() => {
        resizeHandler = null;
        vi.spyOn(window, "addEventListener").mockImplementation((event: string, handler: unknown) => {
            if (event === "resize") {
                resizeHandler = handler as () => void;
            }
        });
        vi.spyOn(window, "removeEventListener").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("shows warning when viewport width is less than minWidth", () => {
        Object.defineProperty(window, "innerWidth", { value: 800, configurable: true });
        Object.defineProperty(window, "innerHeight", { value: 900, configurable: true });

        render(<ScreenSizeWarning minWidth={1200} />);
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(screen.getByText(/too small to display this page properly/)).toBeInTheDocument();
    });

    it("does not show warning when viewport is large enough", () => {
        Object.defineProperty(window, "innerWidth", { value: 1400, configurable: true });
        Object.defineProperty(window, "innerHeight", { value: 900, configurable: true });

        render(<ScreenSizeWarning minWidth={1200} />);
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows warning when viewport height is less than minHeight", () => {
        Object.defineProperty(window, "innerWidth", { value: 1400, configurable: true });
        Object.defineProperty(window, "innerHeight", { value: 400, configurable: true });

        render(<ScreenSizeWarning minWidth={1200} minHeight={600} />);
        expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("can be dismissed by clicking the close button", () => {
        Object.defineProperty(window, "innerWidth", { value: 800, configurable: true });
        Object.defineProperty(window, "innerHeight", { value: 900, configurable: true });

        render(<ScreenSizeWarning minWidth={1200} />);
        expect(screen.getByRole("alert")).toBeInTheDocument();

        fireEvent.click(screen.getByLabelText("Dismiss warning"));
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows zoom shortcut text", () => {
        Object.defineProperty(window, "innerWidth", { value: 800, configurable: true });
        Object.defineProperty(window, "innerHeight", { value: 900, configurable: true });

        render(<ScreenSizeWarning minWidth={1200} />);
        // Should show either Ctrl+- or ⌘- depending on platform
        const alert = screen.getByRole("alert");
        expect(alert.textContent).toMatch(/zooming out/);
    });

    it("updates visibility on window resize", () => {
        Object.defineProperty(window, "innerWidth", { value: 1400, configurable: true });
        Object.defineProperty(window, "innerHeight", { value: 900, configurable: true });

        render(<ScreenSizeWarning minWidth={1200} />);
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();

        // Simulate resize to a smaller viewport
        Object.defineProperty(window, "innerWidth", { value: 800, configurable: true });
        act(() => {
            if (resizeHandler) resizeHandler();
        });

        expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("removes event listener on unmount", () => {
        Object.defineProperty(window, "innerWidth", { value: 800, configurable: true });
        Object.defineProperty(window, "innerHeight", { value: 900, configurable: true });

        const { unmount } = render(<ScreenSizeWarning minWidth={1200} />);
        unmount();

        expect(window.removeEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
    });
});
