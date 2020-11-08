export interface IPlayer {
    team: string;
    name: string;
    connectionId: string;
}

export interface ITeam {
    name: string;

    score: number;

    players: IPlayer[];
}

export type TeamDictionary = { [key: string]: ITeam };

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
