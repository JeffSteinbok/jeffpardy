// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";
import { Timer } from "./Timer";

describe("Timer", () => {
    it("renders a timer with a timerFill child", () => {
        const { container } = render(<Timer percentageRemaining={1} />);
        const timerDiv = container.querySelector(".timer");
        expect(timerDiv).toBeInTheDocument();
        const fill = timerDiv!.querySelector(".timerFill");
        expect(fill).toBeInTheDocument();
    });

    it("has 100% width when percentageRemaining is 0 (fully elapsed)", () => {
        const { container } = render(<Timer percentageRemaining={0} />);
        const fill = container.querySelector(".timerFill") as HTMLElement;
        expect(fill.style.width).toBe("100%");
    });

    it("has 0% width when percentageRemaining is 1 (not started)", () => {
        const { container } = render(<Timer percentageRemaining={1} />);
        const fill = container.querySelector(".timerFill") as HTMLElement;
        expect(fill.style.width).toBe("0%");
    });

    it("has 50% width when percentageRemaining is 0.5", () => {
        const { container } = render(<Timer percentageRemaining={0.5} />);
        const fill = container.querySelector(".timerFill") as HTMLElement;
        expect(fill.style.width).toBe("50%");
    });

    it("has 75% width when percentageRemaining is 0.25", () => {
        const { container } = render(<Timer percentageRemaining={0.25} />);
        const fill = container.querySelector(".timerFill") as HTMLElement;
        expect(fill.style.width).toBe("75%");
    });
});
