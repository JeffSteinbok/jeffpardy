// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { describe, it, expect } from "vitest";
import { Key, SpecialKey } from "./Key";

describe("Key", () => {
    it("maps SPACE to keycode 32", () => {
        expect(Key.SPACE).toBe(32);
    });

    it("maps letter keys to correct keycodes", () => {
        expect(Key.A).toBe(65);
        expect(Key.Z).toBe(90);
    });

    it("maps number keys to correct keycodes", () => {
        expect(Key.NUM_0).toBe(48);
        expect(Key.NUM_9).toBe(57);
    });

    it("maps numpad keys to correct keycodes", () => {
        expect(Key.NUM_PAD_0).toBe(96);
        expect(Key.NUM_PAD_9).toBe(105);
    });

    it("maps punctuation keys", () => {
        expect(Key.COMMA).toBe(188);
        expect(Key.PERIOD).toBe(190);
        expect(Key.SLASH).toBe(191);
    });
});

describe("SpecialKey", () => {
    it("maps ENTER to keycode 13", () => {
        expect(SpecialKey.ENTER).toBe(13);
    });

    it("maps ESCAPE to keycode 27", () => {
        expect(SpecialKey.ESCAPE).toBe(27);
    });

    it("maps arrow keys to correct keycodes", () => {
        expect(SpecialKey.LEFT).toBe(37);
        expect(SpecialKey.UP).toBe(38);
        expect(SpecialKey.RIGHT).toBe(39);
        expect(SpecialKey.DOWN).toBe(40);
    });

    it("shares SPACE keycode with Key.SPACE", () => {
        expect(SpecialKey.SPACE).toBe(Key.SPACE);
    });

    it("maps function keys", () => {
        expect(SpecialKey.F1).toBe(112);
        expect(SpecialKey.F12).toBe(123);
    });
});
