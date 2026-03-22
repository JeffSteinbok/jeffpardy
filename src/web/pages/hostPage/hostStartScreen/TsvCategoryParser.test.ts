import { describe, it, expect } from "vitest";
import { parseGameDataFromTsv, parseRoundFromTsv } from "./TsvCategoryParser";

// Helper: build TSV for a single round
// Format: header (line 0), categories (line 1), 5 pairs of clue/answer (lines 2-11),
// blank separator (line 12), then final jeffpardy (lines 13-16)
function buildSingleRoundTsv(): string {
    const lines: string[] = [];
    lines.push("Round 1"); // line 0
    lines.push("Cat1\tCat2\tCat3\tCat4\tCat5\tCat6"); // line 1: category titles
    for (let i = 0; i < 5; i++) {
        lines.push(`C1Q${i}\tC2Q${i}\tC3Q${i}\tC4Q${i}\tC5Q${i}\tC6Q${i}`);
        lines.push(`C1A${i}\tC2A${i}\tC3A${i}\tC4A${i}\tC5A${i}\tC6A${i}`);
    }
    lines.push(""); // line 12: separator
    lines.push("Final Jeffpardy"); // line 13
    lines.push("Final Category Title"); // line 14
    lines.push("Final Clue Text"); // line 15
    lines.push("Final Answer Text"); // line 16
    return lines.join("\n");
}

function buildTwoRoundTsv(): string {
    const lines: string[] = [];
    // Round 1 (lines 0-11)
    lines.push("Round 1");
    lines.push("R1Cat1\tR1Cat2\tR1Cat3\tR1Cat4\tR1Cat5\tR1Cat6");
    for (let i = 0; i < 5; i++) {
        lines.push(`R1C1Q${i}\tR1C2Q${i}\tR1C3Q${i}\tR1C4Q${i}\tR1C5Q${i}\tR1C6Q${i}`);
        lines.push(`R1C1A${i}\tR1C2A${i}\tR1C3A${i}\tR1C4A${i}\tR1C5A${i}\tR1C6A${i}`);
    }
    lines.push(""); // line 12: separator
    // Round 2 (lines 13-24)
    lines.push("Round 2");
    lines.push("R2Cat1\tR2Cat2\tR2Cat3\tR2Cat4\tR2Cat5\tR2Cat6");
    for (let i = 0; i < 5; i++) {
        lines.push(`R2C1Q${i}\tR2C2Q${i}\tR2C3Q${i}\tR2C4Q${i}\tR2C5Q${i}\tR2C6Q${i}`);
        lines.push(`R2C1A${i}\tR2C2A${i}\tR2C3A${i}\tR2C4A${i}\tR2C5A${i}\tR2C6A${i}`);
    }
    lines.push(""); // line 25: separator
    // Final (lines 26-29)
    lines.push("Final Jeffpardy");
    lines.push("FJ Category");
    lines.push("FJ Clue");
    lines.push("FJ Answer");
    return lines.join("\n");
}

describe("parseRoundFromTsv", () => {
    it("parses 6 categories from a round", () => {
        const lines = buildSingleRoundTsv().split("\n");
        const categories = parseRoundFromTsv(lines, 0);

        expect(categories.length).toBe(6);
        expect(categories[0].title).toBe("Cat1");
        expect(categories[5].title).toBe("Cat6");
    });

    it("parses 5 clues per category", () => {
        const lines = buildSingleRoundTsv().split("\n");
        const categories = parseRoundFromTsv(lines, 0);

        categories.forEach((cat) => {
            expect(cat.clues.length).toBe(5);
        });
    });

    it("correctly assigns clue and question text", () => {
        const lines = buildSingleRoundTsv().split("\n");
        const categories = parseRoundFromTsv(lines, 0);

        expect(categories[0].clues[0].clue).toBe("C1Q0");
        expect(categories[0].clues[0].question).toBe("C1A0");
        expect(categories[2].clues[3].clue).toBe("C3Q3");
        expect(categories[2].clues[3].question).toBe("C3A3");
    });

    it("initializes all clue flags to false/0", () => {
        const lines = buildSingleRoundTsv().split("\n");
        const categories = parseRoundFromTsv(lines, 0);

        categories.forEach((cat) => {
            expect(cat.isAsked).toBe(false);
            expect(cat.hasDailyDouble).toBe(false);
            cat.clues.forEach((clue) => {
                expect(clue.isAsked).toBe(false);
                expect(clue.isDailyDouble).toBe(false);
                expect(clue.value).toBe(0);
            });
        });
    });
});

describe("parseGameDataFromTsv", () => {
    it("parses a single round with final jeffpardy", () => {
        const tsv = buildSingleRoundTsv();
        const gameData = parseGameDataFromTsv(tsv);

        expect(gameData.rounds.length).toBe(1);
        expect(gameData.rounds[0].name).toBe("Jeffpardy");
        expect(gameData.rounds[0].id).toBe(0);
        expect(gameData.rounds[0].categories.length).toBe(6);
    });

    it("parses final jeffpardy category from single round", () => {
        const tsv = buildSingleRoundTsv();
        const gameData = parseGameDataFromTsv(tsv);

        expect(gameData.finalJeffpardyCategory).not.toBeNull();
        expect(gameData.finalJeffpardyCategory.title).toBe("Final Category Title");
        expect(gameData.finalJeffpardyCategory.clues[0].clue).toBe("Final Clue Text");
        expect(gameData.finalJeffpardyCategory.clues[0].question).toBe("Final Answer Text");
    });

    it("parses two rounds with final jeffpardy", () => {
        const tsv = buildTwoRoundTsv();
        const gameData = parseGameDataFromTsv(tsv);

        expect(gameData.rounds.length).toBe(2);
        expect(gameData.rounds[0].name).toBe("Jeffpardy");
        expect(gameData.rounds[1].name).toBe("Super Jeffpardy");
        expect(gameData.rounds[1].id).toBe(1);
    });

    it("parses final jeffpardy from two round format", () => {
        const tsv = buildTwoRoundTsv();
        const gameData = parseGameDataFromTsv(tsv);

        expect(gameData.finalJeffpardyCategory.title).toBe("FJ Category");
        expect(gameData.finalJeffpardyCategory.clues[0].clue).toBe("FJ Clue");
        expect(gameData.finalJeffpardyCategory.clues[0].question).toBe("FJ Answer");
    });

    it("sets final jeffpardy defaults correctly", () => {
        const tsv = buildSingleRoundTsv();
        const gameData = parseGameDataFromTsv(tsv);
        const fj = gameData.finalJeffpardyCategory;

        expect(fj.hasDailyDouble).toBe(false);
        expect(fj.isAsked).toBe(false);
        expect(fj.clues[0].isDailyDouble).toBe(false);
        expect(fj.clues[0].isAsked).toBe(false);
        expect(fj.clues[0].value).toBe(0);
    });
});
