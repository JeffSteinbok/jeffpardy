import { describe, it, expect, vi } from "vitest";
import { render, within } from "@testing-library/react";
import * as React from "react";

// Mock createRoot to prevent the module-level mount side effect in StartPage.tsx
vi.mock("react-dom/client", async (importOriginal) => {
    const actual = await importOriginal<typeof import("react-dom/client")>();
    return {
        ...actual,
        createRoot: vi.fn(() => ({ render: vi.fn(), unmount: vi.fn() })),
    };
});

import { StartPage } from "./StartPage";

// Restore real createRoot for testing-library's render()
vi.restoreAllMocks();

describe("StartPage", () => {
    it("renders the title logo", () => {
        const { container } = render(<StartPage />);
        const logo = container.querySelector("img.startPageLogo") as HTMLImageElement;
        expect(logo).toBeInTheDocument();
        expect(logo.src).toContain("JeffpardyTitle.png");
    });

    it('has a "Host a Game" link pointing to /host', () => {
        const { container } = render(<StartPage />);
        const link = within(container).getByRole("link", { name: "Host a Game" });
        expect(link).toHaveAttribute("href", "/host");
    });

    it('has a "Join a Game" link pointing to /player', () => {
        const { container } = render(<StartPage />);
        const link = within(container).getByRole("link", { name: "Join a Game" });
        expect(link).toHaveAttribute("href", "/player");
    });
});
