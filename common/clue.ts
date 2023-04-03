import { Coordinate } from "./coordinate";

export interface Clue {
    coordinates: Coordinate[],
    nbCluesLeft: number
}

export function instanceOfClue(object: any): object is Clue {
    return 'coordinates' in object && 'nbCluesLeft' in object;
}