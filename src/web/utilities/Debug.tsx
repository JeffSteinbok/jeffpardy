// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { Logger } from "./Logger";
import { IGameData } from "../pages/hostPage/Types";
import { LoremIpsum } from "./LoremIpsum";
import { IClue, ICategory } from "../Types";

export enum DebugFlags {
    None = 0,
    VerboseLogging = 1 << 0,
    LocalCategories = 1 << 1,
    SkipIntro = 1 << 2,
    DailyDouble00 = 1 << 3,
    FixedGameCode = 1 << 4,
    ShortRound = 1 << 5,
    ShortTimers = 1 << 6,
    FinalJeffpardy = 1 << 7,
    FastFinalJeffpardy = 1 << 8,
    SkipCategoryReveal = 1 << 9,
}

// Some helpful values:
// Skip Intro Only: 4
// Skip Intro & Skip Category Reveal: 204
// Skip Intro & Local Categories:  6
// Skip Intro & Local Categories & Quick Timers:  46
// Skip Intro & Local Categories & DD:  1E

/** Utility class for managing debug flags and generating mock game data for local development and testing. */
export class Debug {
    static flags = DebugFlags.None;

    public static SetFlags(debugFlags: DebugFlags): void {
        Logger.debug("Set Debug Flags: ", debugFlags);
        Debug.flags = debugFlags;
    }

    public static IsFlagSet(debugFlag: DebugFlags): boolean {
        return (Debug.flags & debugFlag) === debugFlag;
    }

    public static generateClue(): IClue {
        return {
            clue: LoremIpsum.generate(Math.floor(Math.random() * 8) + 2),
            question: LoremIpsum.generate(Math.floor(Math.random() * 5) + 2),
            value: 0,
            isAsked: false,
            isDailyDouble: false,
        };
    }

    public static generateCategory(): ICategory {
        const clues = [
            Debug.generateClue(),
            Debug.generateClue(),
            Debug.generateClue(),
            Debug.generateClue(),
            Debug.generateClue(),
        ];
        // Wrap the second clue's text in <i> tags for testing HTML rendering
        clues[1].clue = "<i>" + clues[1].clue + "</i>";
        clues[1].question = "<i>" + clues[1].question + "</i>";

        return {
            title: LoremIpsum.generate(Math.floor(Math.random() * 2) + 1).toUpperCase(),
            airDate: "1994-01-21T00:11:00",
            comment: LoremIpsum.generate(Math.floor(Math.random() * 10) + 6),
            isAsked: false,
            clues: clues,
            hasDailyDouble: false,
        };
    }

    public static generateFinalCategory(): ICategory {
        const clue = Debug.generateClue();
        clue.clue = "<i>" + clue.clue + "</i>";
        clue.question = "<i>" + clue.question + "</i>";
        return {
            title: LoremIpsum.generate(Math.floor(Math.random() * 2) + 1).toUpperCase(),
            airDate: "1994-01-21T00:11:00",
            comment: LoremIpsum.generate(Math.floor(Math.random() * 10) + 6),
            isAsked: false,
            clues: [clue],
            hasDailyDouble: false,
        };
    }

    public static generateGameData(): IGameData {
        return {
            rounds: [
                {
                    id: 0,
                    name: "Jeffpardy",
                    categories: [
                        Debug.generateCategory(),
                        Debug.generateCategory(),
                        Debug.generateCategory(),
                        Debug.generateCategory(),
                        Debug.generateCategory(),
                        Debug.generateCategory(),
                    ],
                },
                {
                    id: 1,
                    name: "Super Jeffpardy",
                    categories: [
                        Debug.generateCategory(),
                        Debug.generateCategory(),
                        Debug.generateCategory(),
                        Debug.generateCategory(),
                        Debug.generateCategory(),
                        Debug.generateCategory(),
                    ],
                },
            ],
            finalJeffpardyCategory: Debug.generateFinalCategory(),
        };
    }
}
