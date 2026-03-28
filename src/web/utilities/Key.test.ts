// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { describe, it, expect } from "vitest";
import { Key, SpecialKey } from "./Key";

describe("Key", () => {
    it("maps SPACE to space character", () => {
        expect(Key.SPACE).toBe(" ");
    });

    it("maps letter keys to correct key values", () => {
        expect(Key.A).toBe("a");
        expect(Key.Z).toBe("z");
    });

    it("maps number keys to correct key values", () => {
        expect(Key.NUM_0).toBe("0");
        expect(Key.NUM_9).toBe("9");
    });

    it("maps punctuation keys", () => {
        expect(Key.COMMA).toBe(",");
        expect(Key.PERIOD).toBe(".");
        expect(Key.SLASH).toBe("/");
    });
});

describe("SpecialKey", () => {
    it("maps ENTER to Enter", () => {
        expect(SpecialKey.ENTER).toBe("Enter");
    });

    it("maps ESCAPE to Escape", () => {
        expect(SpecialKey.ESCAPE).toBe("Escape");
    });

    it("maps arrow keys to correct key values", () => {
        expect(SpecialKey.LEFT).toBe("ArrowLeft");
        expect(SpecialKey.UP).toBe("ArrowUp");
        expect(SpecialKey.RIGHT).toBe("ArrowRight");
        expect(SpecialKey.DOWN).toBe("ArrowDown");
    });

    it("shares SPACE value with Key.SPACE", () => {
        expect(SpecialKey.SPACE).toBe(Key.SPACE);
    });

    it("maps function keys", () => {
        expect(SpecialKey.F1).toBe("F1");
        expect(SpecialKey.F12).toBe("F12");
    });
});
