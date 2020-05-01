export interface IClue {
    clue: string;
    question: string;
    value: number;
    isAsked: boolean;
    isDailyDouble: boolean;
}

export interface ICategory {
    title: string;
    comment: string;
    airDate: string;
    // Need to change the JSON format to fix this
    clues: IClue[];
    isAsked: boolean;
    hasDailyDouble: boolean;
}

export interface IGameRound {
    id: number;
    name: string;
    categories: ICategory[];
}

export interface IGameData {
    rounds: IGameRound[];
    finalJeffpardyCategory: ICategory;
}

export interface IFinalJeffpardyAnswer {
    answer: string;
    responseTime: number;
}

export type FinalJeffpardySubmissionDictionary = { [key: string]: any };
export type FinalJeffpardyWagerDictionary = { [key: string]: number };
export type FinalJeffpardyAnswerDictionary = { [key: string]: IFinalJeffpardyAnswer };
