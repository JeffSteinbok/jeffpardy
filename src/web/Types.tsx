// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

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

export interface IBuzzerAttempt {
    player: IPlayer;
    time: number;
}

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

export interface ICategoryMetadata {
    title: string;
    airDate: string;
    season: number;
    fileName: string;
    int;
    index;
}
