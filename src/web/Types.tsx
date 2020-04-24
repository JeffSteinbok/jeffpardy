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
