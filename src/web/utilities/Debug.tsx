import { Logger } from "./Logger";
import { ICategory, IGameData, IClue } from "../JeffpardyHostController";

export enum DebugFlags {
    None = 0,
    VerboseLogging = 1 << 0,
    LocalCategories = 1 << 1,
    SkipIntro = 1 << 2,
    DailyDouble00 = 1 << 3,
    FixedGameCode = 1 << 4,
}

export class Debug {
    static flags = DebugFlags.None;

    public static SetFlags(debugFlags: DebugFlags): void {
        Logger.debug("Set Debug Flags: ", debugFlags)
        Debug.flags = debugFlags;
    }

    public static IsFlagSet(debugFlag: DebugFlags): boolean {
        return (Debug.flags & debugFlag) === debugFlag;
    }

    // Lots of ugliness to avoid copy constructors
    // TODO: Add copy constructors
    // TODO: Customize questions.
    public static GameDataClue: IClue = {
        clue: "Sample Clue",
        question: "Sample Question",
        value: 0,
        isAsked: false,
        isDailyDouble: false
    }

    public static GameDataCategory: ICategory = {
        title: "COMMON BONDS",
        airDate: "1994-01-21T00:11:00",
        comment: "Comment Here",
        isAsked: false,
        clues: [
            JSON.parse(JSON.stringify(Debug.GameDataClue)),
            JSON.parse(JSON.stringify(Debug.GameDataClue)),
            JSON.parse(JSON.stringify(Debug.GameDataClue)),
            JSON.parse(JSON.stringify(Debug.GameDataClue)),
            JSON.parse(JSON.stringify(Debug.GameDataClue))],
        hasDailyDouble: false
    }

    public static GameData: IGameData = {
        rounds: [
            {
                id: 0,
                categories: [
                    JSON.parse(JSON.stringify(Debug.GameDataCategory)),
                    JSON.parse(JSON.stringify(Debug.GameDataCategory)),
                    JSON.parse(JSON.stringify(Debug.GameDataCategory)),
                    JSON.parse(JSON.stringify(Debug.GameDataCategory)),
                    JSON.parse(JSON.stringify(Debug.GameDataCategory)),
                    JSON.parse(JSON.stringify(Debug.GameDataCategory)),
                ],
            },
            {
                id: 1,
                categories: [
                    JSON.parse(JSON.stringify(Debug.GameDataCategory)),
                    JSON.parse(JSON.stringify(Debug.GameDataCategory)),
                    JSON.parse(JSON.stringify(Debug.GameDataCategory)),
                    JSON.parse(JSON.stringify(Debug.GameDataCategory)),
                    JSON.parse(JSON.stringify(Debug.GameDataCategory)),
                    JSON.parse(JSON.stringify(Debug.GameDataCategory)),
                ],
            }
        ]
    }
}
