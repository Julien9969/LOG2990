import { DifferenceValidationService } from '@app/services/difference-validation/difference-validation.service';
import { Coordinate } from '@common/coordinate';
import { GuessResult } from '@common/guess-result';

export interface Session {
    gameID: string;
    id: number;
    nGuesses: number;
    nPenalties: number;
    time: number;
    timerId: NodeJS.Timeout;
    differenceValidationService: DifferenceValidationService;

    stopTime();
    tryGuess(guess: Coordinate): GuessResult;
    buildGuessResult(isCorrect: boolean, differencePixelList: Coordinate[]): GuessResult;
    get formatedTime(): string;
}
