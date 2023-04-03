import { TIME_CONST } from '@app/services/constants/services.const';
import { DifferenceValidationService } from '@app/services/difference-validation/difference-validation.service';
import { GameService } from '@app/services/game/game.service';
import { Coordinate } from '@common/coordinate';
import { Game } from '@common/game';
import { GuessResult } from '@common/guess-result';

export class LimitedTimeSession {
    gameID: string;
    id: number;
    nGuesses: number = 0;
    nPenalties: number = 0;
    nDifferencesFound: number;
    time: number = 0;
    timerId: NodeJS.Timeout;
    playedGames: Game[] = [];
    gameService: GameService;
    differenceValidationService: DifferenceValidationService = new DifferenceValidationService();
    player: string[] = [];

    constructor(gameID: number, gameService: GameService, firstSocketId: string, secondSocketId?: string) {
        this.gameService = gameService;
        this.player.push(firstSocketId);
        if (secondSocketId) this.player.push(secondSocketId);
        // if (!mongoose.isValidObjectId(gameID)) throw new Error('Invalid gameID for session create');
        this.decideNewGame();
    }

    /**
     * Retourne le temps écoulé depuis le début de la session en format mm:ss
     *
     * @returns Le temps en format mm:ss
     */
    get formatedTime(): string {
        const minutes = Math.floor(this.time / TIME_CONST.minute);
        const seconds = this.time % TIME_CONST.secondInMilliseconds;
        return minutes + ':' + seconds.toString().padStart(2, '0');
    }

    /**
     * Retourne si la session est en solo ou multi-joueur
     *
     * @returns le nombre de joueurs dans la session
     */
    get isSolo(): boolean {
        return this.player.length === 1;
    }

    /**
     * Arrête le timer de la session
     */
    stopTimer() {
        clearInterval(this.timerId);
    }

    /**
     * Traite un essai de différence du jeu dans la session courante
     *
     * @param guess La coordonnée de l'essai
     * @returns Le résultat de l'essai
     */
    tryGuess(guess: Coordinate): GuessResult {
        const diffPixelList: Coordinate[] = [];
        if (!this.differenceValidationService.validateGuess(guess)) throw new Error('Mauvais format de guess.');

        const isCorrect = this.differenceValidationService.validateGuess(guess) !== undefined;
        // Traitement des pénalités, le cas échéant
        if (isCorrect) {
            this.decideNewGame();
        } else this.nPenalties++;

        return this.buildGuessResult(isCorrect, diffPixelList);
    }

    /**
     * Construit l'objet GuessResult à retourner au client
     *
     * @param isCorrect si le guess est correct ou non
     * @param differencePixelList liste des pixels de la différence trouvée
     * @returns l'objet GuessResult
     */
    buildGuessResult(isCorrect: boolean, differencePixelList: Coordinate[]): GuessResult {
        const guessResult: GuessResult = {
            isCorrect,
            differencesByPlayer: [],
            differencePixelList,
            winnerName: '',
        };
        return guessResult;
    }

    /**
     * Verifie si un joueur a gagne la partie
     *
     * @returns le socketId du joueur gagnant ou un string indiquant qu'il n'y a pas de gagnant
     */
    async decideNewGame() {
        const newGame: Game = await this.gameService.getRandomGame();
        this.gameID = newGame.id;
        this.differenceValidationService.loadDifferences(this.gameID.toString());
    }
}
