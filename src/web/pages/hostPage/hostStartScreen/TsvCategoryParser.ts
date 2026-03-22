import { ICategory } from "../../../Types";
import { IGameData } from "../Types";

/**
 * Parses game data from TSV (tab-separated values) format,
 * typically pasted from an Excel template.
 */
export function parseGameDataFromTsv(tsv: string): IGameData {
    const lines: string[] = tsv.split("\n");

    const gameData: IGameData = {
        rounds: [],
        finalJeffpardyCategory: null,
    };

    let finalJeffpardyLineStart: number = 13;

    gameData.rounds.push({
        id: 0,
        name: "Jeffpardy",
        categories: parseRoundFromTsv(lines, 0),
    });

    if (lines[13].startsWith("Round 2")) {
        gameData.rounds.push({
            id: 1,
            name: "Super Jeffpardy",
            categories: parseRoundFromTsv(lines, 13),
        });
        finalJeffpardyLineStart = 26;
    }

    gameData.finalJeffpardyCategory = {
        title: lines[finalJeffpardyLineStart + 1],
        comment: "",
        airDate: "1900-01-21T00:11:00",
        hasDailyDouble: false,
        isAsked: false,
        clues: [
            {
                clue: lines[finalJeffpardyLineStart + 2],
                question: lines[finalJeffpardyLineStart + 3],
                isDailyDouble: false,
                isAsked: false,
                value: 0,
            },
        ],
    };

    return gameData;
}

export function parseRoundFromTsv(lines: string[], startLineIndex: number): ICategory[] {
    const categories: ICategory[] = [];

    lines[startLineIndex + 1].split("\t").forEach((value, _index) => {
        const category: ICategory = {
            title: value,
            clues: [],
            comment: "",
            airDate: "1900-01-21T00:11:00",
            hasDailyDouble: false,
            isAsked: false,
        };
        categories.push(category);
    });

    for (let i: number = 0; i < 5; i++) {
        const clues: string[] = lines[startLineIndex + 2 + i * 2].split("\t");
        const questions: string[] = lines[startLineIndex + 2 + i * 2 + 1].split("\t");

        for (let j: number = 0; j < 6; j++) {
            categories[j].clues.push({
                clue: clues[j],
                question: questions[j],
                isAsked: false,
                isDailyDouble: false,
                value: 0,
            });
        }
    }

    return categories;
}
