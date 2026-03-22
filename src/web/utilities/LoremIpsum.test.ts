import { describe, it, expect, vi, afterEach } from "vitest";
import { LoremIpsum } from "./LoremIpsum";

describe("LoremIpsum", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("has a static words array with entries", () => {
        expect(Array.isArray(LoremIpsum.words)).toBe(true);
        expect(LoremIpsum.words.length).toBeGreaterThan(0);
    });

    it("generate(n) returns a string with n words", () => {
        const result = LoremIpsum.generate(5);
        expect(result.split(" ").length).toBe(5);
    });

    it("generate(0) returns an empty string", () => {
        expect(LoremIpsum.generate(0)).toBe("");
    });

    it("generate(1) returns a single word from the words array", () => {
        const result = LoremIpsum.generate(1);
        expect(result.split(" ").length).toBe(1);
        expect(LoremIpsum.words).toContain(result);
    });

    it("does not produce consecutive duplicate words", () => {
        // Generate a long string to increase the chance of catching duplicates
        const result = LoremIpsum.generate(50);
        const words = result.split(" ");
        for (let i = 1; i < words.length; i++) {
            expect(words[i]).not.toBe(words[i - 1]);
        }
    });
});
