export interface IQuestion {
    clue: string;
    question: string;
}

export interface ICategory {
    title: string;
    questions: IQuestion[];
}
