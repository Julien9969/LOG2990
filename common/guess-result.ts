import { Coordinate } from './coordinate';

export interface GuessResult {
    isCorrect: boolean;
    differencesByPlayer: [ userSocketId: string, nDifferences: number ][];
    differencePixelList: Coordinate[];
    winnerName: string | undefined;
}