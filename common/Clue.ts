import { Coordinate } from "./coordinate";

export interface Clue {
    coordinates: Coordinate[],
    nbCluesLeft: number
}