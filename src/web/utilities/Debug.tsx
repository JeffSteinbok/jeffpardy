// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { Logger } from "./Logger";
import { IGameData, FinalJeffpardyWagerDictionary, FinalJeffpardyAnswerDictionary } from "../pages/hostPage/Types";
import { LoremIpsum } from "./LoremIpsum";
import { IClue, ICategory, IPlayer, ITeam, TeamDictionary } from "../Types";

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
    FakeTeams = 1 << 10, // 0x400 — Creates 3 fake teams with 4 players each
}

// Some helpful values:
// Skip Intro Only: 4
// Skip Intro & Skip Category Reveal: 204
// Skip Intro & Local Categories:  6
// Skip Intro & Local Categories & Quick Timers:  46
// Skip Intro & Local Categories & DD:  1E
// Full speed-run (all shortcuts + fake teams): 7FE

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
        return {
            title: LoremIpsum.generate(Math.floor(Math.random() * 2) + 1).toUpperCase(),
            airDate: "1994-01-21T00:11:00",
            comment: LoremIpsum.generate(Math.floor(Math.random() * 10) + 6),
            isAsked: false,
            clues: [Debug.generateClue()],
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

    private static readonly fakeTeamNames = ["The Quizzards", "Brain Storm", "Trivial Pursuit"];
    private static readonly fakePlayerNames = [
        ["Alice", "Bob", "Carol", "Dave"],
        ["Eve", "Frank", "Grace", "Hank"],
        ["Ivy", "Jack", "Karen", "Leo"],
    ];

    /** Generate 3 fake teams with 4 players each for testing without real players. */
    public static generateFakeTeams(): TeamDictionary {
        const teams: TeamDictionary = {};

        for (let t = 0; t < 3; t++) {
            const teamName = Debug.fakeTeamNames[t];
            const players: IPlayer[] = Debug.fakePlayerNames[t].map((name, i) => ({
                team: teamName,
                name: name,
                connectionId: `fake-${t}-${i}`,
            }));

            teams[teamName] = {
                name: teamName,
                score: Math.floor(Math.random() * 10000) - 2000,
                players: players,
            };
        }

        return teams;
    }

    /** Generate fake wagers for all players. Each player wagers between 0 and their team's score (or 1000 if negative). */
    public static generateFakeWagers(teams: TeamDictionary): FinalJeffpardyWagerDictionary {
        const wagers: FinalJeffpardyWagerDictionary = {};
        for (const teamName in teams) {
            const team = teams[teamName];
            const maxWager = Math.max(team.score, 1000);
            for (const player of team.players) {
                wagers[player.connectionId] = Math.floor(Math.random() * maxWager);
            }
        }
        return wagers;
    }

    /** Generate fake answers for all players. Randomly correct or incorrect. */
    public static generateFakeAnswers(teams: TeamDictionary): FinalJeffpardyAnswerDictionary {
        const answers: FinalJeffpardyAnswerDictionary = {};
        for (const teamName in teams) {
            const team = teams[teamName];
            for (const player of team.players) {
                answers[player.connectionId] = {
                    answer: LoremIpsum.generate(Math.floor(Math.random() * 3) + 1),
                    responseTime: Math.floor(Math.random() * 25000) + 2000,
                };
            }
        }
        return answers;
    }
}
