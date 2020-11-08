import { ICategory } from "../../Types";

export enum RoundDescriptor {
    Jeffpardy,
    SuperJeffpardy,
    FinalJeffpardy
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
