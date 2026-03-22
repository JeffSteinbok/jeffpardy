// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { Attribution } from "./Attribution";

describe("Attribution", () => {
    it("renders the COVID-19 attribution text", () => {
        render(<Attribution />);
        expect(screen.getByText(/Jeffpardy was created to pass the time during COVID-19/)).toBeInTheDocument();
    });

    it("renders the Jeopardy Productions disclaimer", () => {
        render(<Attribution />);
        expect(
            screen.getByText(/not affiliated with, sponsored by, or operated by Jeopardy Productions, Inc/)
        ).toBeInTheDocument();
    });

    it("has the attribution class", () => {
        const { container } = render(<Attribution />);
        expect(container.querySelector(".attribution")).toBeInTheDocument();
    });
});
