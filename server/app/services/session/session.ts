import { DifferenceValidationService } from '@app/services/difference-validation/difference-validation.service';
import { Coordinate } from '@common/coordinate';
import { GuessResult } from '@common/guess-result';
import { Player } from '@common/player';

export interface Session {
    gameID: string;
    id: number;
    nGuesses: number;
    nPenalties: number;
    time: number;
    timerId: NodeJS.Timeout;
    differenceValidationService: DifferenceValidationService;
    players: Player[];

    stopTimer();
    tryGuess(guess: Coordinate, socketId: string): GuessResult;
    buildGuessResult(isCorrect: boolean, differencePixelList: Coordinate[]): GuessResult;
    get formatedTime(): string;
    get isSolo(): boolean;
}
