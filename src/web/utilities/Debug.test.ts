import { describe, it, expect, vi, afterEach } from "vitest";
import { Debug, DebugFlags } from "./Debug";

describe("Debug", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        Debug.flags = DebugFlags.None;
    });

    describe("DebugFlags", () => {
        it("has correct bit values", () => {
            expect(DebugFlags.None).toBe(0);
            expect(DebugFlags.VerboseLogging).toBe(1);
            expect(DebugFlags.LocalCategories).toBe(2);
            expect(DebugFlags.SkipIntro).toBe(4);
            expect(DebugFlags.DailyDouble00).toBe(8);
            expect(DebugFlags.FixedGameCode).toBe(16);
            expect(DebugFlags.ShortRound).toBe(32);
            expect(DebugFlags.ShortTimers).toBe(64);
            expect(DebugFlags.FinalJeffpardy).toBe(128);
            expect(DebugFlags.FastFinalJeffpardy).toBe(256);
            expect(DebugFlags.SkipCategoryReveal).toBe(512);
        });
    });

    describe("SetFlags", () => {
        it("sets the static flags property", () => {
            Debug.SetFlags(DebugFlags.SkipIntro);
            expect(Debug.flags).toBe(DebugFlags.SkipIntro);
        });
    });

    describe("IsFlagSet", () => {
        it("returns true when flag is set", () => {
            Debug.flags = DebugFlags.SkipIntro;
            expect(Debug.IsFlagSet(DebugFlags.SkipIntro)).toBe(true);
        });

        it("returns false when flag is not set", () => {
            Debug.flags = DebugFlags.None;
            expect(Debug.IsFlagSet(DebugFlags.SkipIntro)).toBe(false);
        });

        it("works with combined flags", () => {
            Debug.flags = DebugFlags.SkipIntro | DebugFlags.LocalCategories;
            expect(Debug.flags).toBe(6);
            expect(Debug.IsFlagSet(DebugFlags.SkipIntro)).toBe(true);
            expect(Debug.IsFlagSet(DebugFlags.LocalCategories)).toBe(true);
            expect(Debug.IsFlagSet(DebugFlags.VerboseLogging)).toBe(false);
        });
    });

    describe("generateClue", () => {
        it("returns an object with clue, question, value, isAsked, isDailyDouble properties", () => {
            const clue = Debug.generateClue();
            expect(clue).toHaveProperty("clue");
            expect(clue).toHaveProperty("question");
            expect(clue).toHaveProperty("value");
            expect(clue).toHaveProperty("isAsked");
            expect(clue).toHaveProperty("isDailyDouble");
            expect(typeof clue.clue).toBe("string");
            expect(typeof clue.question).toBe("string");
            expect(clue.value).toBe(0);
            expect(clue.isAsked).toBe(false);
            expect(clue.isDailyDouble).toBe(false);
        });
    });

    describe("generateCategory", () => {
        it("returns an object with title, airDate, comment, isAsked, clues (5 items), hasDailyDouble", () => {
            const category = Debug.generateCategory();
            expect(category).toHaveProperty("title");
            expect(category).toHaveProperty("airDate");
            expect(category).toHaveProperty("comment");
            expect(category).toHaveProperty("isAsked");
            expect(category).toHaveProperty("clues");
            expect(category).toHaveProperty("hasDailyDouble");
            expect(typeof category.title).toBe("string");
            expect(category.isAsked).toBe(false);
            expect(category.clues.length).toBe(5);
            expect(category.hasDailyDouble).toBe(false);
        });
    });

    describe("generateFinalCategory", () => {
        it("returns an object with clues array of length 1", () => {
            const category = Debug.generateFinalCategory();
            expect(category.clues.length).toBe(1);
            expect(category.isAsked).toBe(false);
            expect(category.hasDailyDouble).toBe(false);
        });
    });

    describe("generateGameData", () => {
        it("returns object with 2 rounds (6 categories each) and a finalJeffpardyCategory", () => {
            const gameData = Debug.generateGameData();
            expect(gameData.rounds.length).toBe(2);
            expect(gameData.rounds[0].categories.length).toBe(6);
            expect(gameData.rounds[1].categories.length).toBe(6);
            expect(gameData).toHaveProperty("finalJeffpardyCategory");
            expect(gameData.finalJeffpardyCategory.clues.length).toBe(1);
        });
    });
});
