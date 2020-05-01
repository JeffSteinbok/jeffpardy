import { Logger } from "./Logger";
import { ICategory, IGameData, IClue } from "../pages/hostPage/Types";
import { LoremIpsum } from "./LoremIpsum";

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
}

// Some helpful values:
// Skip Intro Only: 4
// Skip Intro & Local Categories:  6

export class Debug {
    static flags = DebugFlags.None;

    public static SetFlags(debugFlags: DebugFlags): void {
        Logger.debug("Set Debug Flags: ", debugFlags)
        Debug.flags = debugFlags;
    }

    public static IsFlagSet(debugFlag: DebugFlags): boolean {
        return (Debug.flags & debugFlag) === debugFlag;
    }

    public static generateClue(): IClue {
        return {
            clue: LoremIpsum.generate(Math.floor(Math.random() * 8) + 2),
            question: LoremIpsum.generate(Math.floor(Math.random() * 1) + 2),
            value: 0,
            isAsked: false,
            isDailyDouble: false
        }
    }

    public static generateCategory(): ICategory {
        return {
            title: LoremIpsum.generate(Math.floor(Math.random() * 2) + 1),
            airDate: "1994-01-21T00:11:00",
            comment: LoremIpsum.generate(Math.floor(Math.random() * 10) + 6),
            isAsked: false,
            clues: [
                Debug.generateClue(),
                Debug.generateClue(),
                Debug.generateClue(),
                Debug.generateClue(),
                Debug.generateClue()],
            hasDailyDouble: false
        }
    }

    public static generateFinalCategory(): ICategory {
        return {
            title: LoremIpsum.generate(Math.floor(Math.random() * 2) + 1),
            airDate: "1994-01-21T00:11:00",
            comment: LoremIpsum.generate(Math.floor(Math.random() * 10) + 6),
            isAsked: false,
            clues: [
                Debug.generateClue()],
            hasDailyDouble: false
        }
    }


    public static GameData: IGameData = {
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
                    Debug.generateCategory()
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
                    Debug.generateCategory()
                ],
            }
        ],
        finalJeffpardyCategory: Debug.generateFinalCategory()
    }
}
