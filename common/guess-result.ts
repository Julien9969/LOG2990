import { Coordinate } from './coordinate';

export interface GuessResult {
    correct: boolean;
    alreadyFound: boolean;
    differenceNum: number;
    differencePixelList: Coordinate[];
}
