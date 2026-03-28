// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { describe, it, expect, vi } from "vitest";
import { createKeyboardHandler } from "./useKeyboardShortcuts";
import { Key, SpecialKey } from "../../../utilities/Key";

describe("createKeyboardHandler", () => {
    it("calls onSpace when Space key is pressed", () => {
        const actions = {
            onSpace: vi.fn(),
            onActivateBuzzer: vi.fn(),
            onCorrectResponse: vi.fn(),
            onIncorrectResponse: vi.fn(),
        };

        const handler = createKeyboardHandler(actions);
        handler({ key: SpecialKey.SPACE } as KeyboardEvent);

        expect(actions.onSpace).toHaveBeenCalledTimes(1);
        expect(actions.onActivateBuzzer).not.toHaveBeenCalled();
    });

    it("calls onActivateBuzzer when A key is pressed", () => {
        const actions = {
            onSpace: vi.fn(),
            onActivateBuzzer: vi.fn(),
            onCorrectResponse: vi.fn(),
            onIncorrectResponse: vi.fn(),
        };

        const handler = createKeyboardHandler(actions);
        handler({ key: Key.A } as KeyboardEvent);

        expect(actions.onActivateBuzzer).toHaveBeenCalledTimes(1);
    });

    it("calls onCorrectResponse when Z key is pressed", () => {
        const actions = {
            onSpace: vi.fn(),
            onActivateBuzzer: vi.fn(),
            onCorrectResponse: vi.fn(),
            onIncorrectResponse: vi.fn(),
        };

        const handler = createKeyboardHandler(actions);
        handler({ key: Key.Z } as KeyboardEvent);

        expect(actions.onCorrectResponse).toHaveBeenCalledTimes(1);
    });

    it("calls onIncorrectResponse when X key is pressed", () => {
        const actions = {
            onSpace: vi.fn(),
            onActivateBuzzer: vi.fn(),
            onCorrectResponse: vi.fn(),
            onIncorrectResponse: vi.fn(),
        };

        const handler = createKeyboardHandler(actions);
        handler({ key: Key.X } as KeyboardEvent);

        expect(actions.onIncorrectResponse).toHaveBeenCalledTimes(1);
    });

    it("does not call any action for unrecognized keys", () => {
        const actions = {
            onSpace: vi.fn(),
            onActivateBuzzer: vi.fn(),
            onCorrectResponse: vi.fn(),
            onIncorrectResponse: vi.fn(),
        };

        const handler = createKeyboardHandler(actions);
        handler({ key: Key.B } as KeyboardEvent);

        expect(actions.onSpace).not.toHaveBeenCalled();
        expect(actions.onActivateBuzzer).not.toHaveBeenCalled();
        expect(actions.onCorrectResponse).not.toHaveBeenCalled();
        expect(actions.onIncorrectResponse).not.toHaveBeenCalled();
    });
});
