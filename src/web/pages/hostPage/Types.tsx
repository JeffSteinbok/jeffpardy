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
