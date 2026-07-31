// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import * as React from "react";

vi.mock("qrcode.react", () => ({
    QRCodeCanvas: (props: { value: string }) => <div data-testid="host-window-qr" data-value={props.value} />,
}));

import { HostWindowQrDialog } from "./HostWindowQrDialog";

describe("HostWindowQrDialog", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("renders the private host window URI as a QR code", () => {
        const uri = "https://localhost/hostSecondary#AAAAAABBBBBB";
        const { getByTestId } = render(<HostWindowQrDialog hostSecondaryWindowUri={uri} onClose={vi.fn()} />);

        expect(getByTestId("host-window-qr")).toHaveAttribute("data-value", uri);
    });

    it("closes when the Close button is clicked", () => {
        const onClose = vi.fn();
        const { getByRole } = render(
            <HostWindowQrDialog hostSecondaryWindowUri="https://localhost/hostSecondary#codes" onClose={onClose} />
        );

        fireEvent.click(getByRole("button", { name: "Close" }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
