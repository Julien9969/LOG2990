import { ALLOWED_NB_CLUES, TIME_CONST } from '@app/services/constants/services.const';
import { DifferenceValidationService } from '@app/services/difference-validation/difference-validation.service';
import { Clue } from '@common/clue';
import { Coordinate } from '@common/coordinate';
import { Player } from '@common/player';

// export interface SessionInterface {
//     gameID: string;
//     id: number;
//     nGuesses: number;
//     nPenalties: number;
//     time: number;
//     timerId: NodeJS.Timeout;
//     differenceValidationService: DifferenceValidationService;
//     players: Player[];

//     nbCluesRequested: number = 0;

//     stopTimer();
//     // tryGuess(guess: Coordinate, socketId: string): GuessResult;
//     buildGuessResult(isCorrect: boolean, differencePixelList: Coordinate[]): GuessResult;
//     get formatedTime(): string;
//     get isSolo(): boolean;
// }

export class Session {
    gameID: string;
    id: number;
    nGuesses: number;
    nPenalties: number;
    time: number;
    timerId: NodeJS.Timeout;
    differenceValidationService: DifferenceValidationService = new DifferenceValidationService();
    players: Player[];
    nbCluesRequested: number = 0;

    /**
     * Retourne si la session est en solo ou multi-joueur
     *
     * @returns le nombre de joueurs dans la session
     */
    get isSolo(): boolean {
        return this.players.length === 1;
    }
    /**
     * Retourne le temps écoulé depuis le début de la session en format mm:ss
     *
     * @returns Le temps en format mm:ss
     */
    get formatedTime(): string {
        const minutes = Math.floor(this.time / TIME_CONST.minute);
        const seconds = this.time % TIME_CONST.minute;
        return minutes + ':' + seconds.toString().padStart(2, '0');
    }
    /**
     * Arrête le timer de la session
     */
    stopTimer() {
        clearInterval(this.timerId);
    }

    /**
     * Offre un indice sous la forme d'une liste de pixels
     * dans laquelle une des différences non-trouvé s'y trouve
     *
     * @return la liste de pixel correspondant à l'indice (pixels qui changerons de couleur sur l'écran)
     */
    async getClue(penalty: number): Promise<Clue | void> {
        if (this.nbCluesRequested >= 3) return;
        this.nbCluesRequested++;
        this.time += penalty;
        const clue: Clue = {
            coordinates: [{ x: 0, y: 0 } as Coordinate],
            nbCluesLeft: ALLOWED_NB_CLUES - this.nbCluesRequested,
        };
        return clue;
    }

    // tryGuess(guess: Coordinate, socketId: string): GuessResult;
}
