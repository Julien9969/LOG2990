import { TIME_CONST } from '@app/services/constants/services.const';
import { DifferenceValidationService } from '@app/services/difference-validation/difference-validation.service';
import { Coordinate } from '@common/coordinate';
import { GuessResult } from '@common/guess-result';

export class Session {
    gameID: string;
    id: number;

    nGuesses: number = 0;
    nPenalties: number = 0;
    penaltyTime: number;

    nDifferences: number;
    differenceValidationService: DifferenceValidationService = new DifferenceValidationService();
    differencesFoundByPlayer: [userSocketId: string, differencesFound: number[]][] = [];

    timeElapsed: number = 0;
    timerId: NodeJS.Timeout;

    nbCluesRequested: number = 0;

    constructor(gameID: string, firstSocketId: string, secondSocketId: string = undefined) {
        this.differencesFoundByPlayer.push([firstSocketId, []]);
        if (secondSocketId) {
            this.differencesFoundByPlayer.push([secondSocketId, []]);
        }
        // if (!mongoose.isValidObjectId(gameID)) throw new Error('Invalid gameID for session create');
        this.gameID = gameID;
        this.differenceValidationService.loadDifferences(this.gameID.toString());
        this.nDifferences = this.differenceValidationService.differenceCoordLists?.length;
    }

    /**
     * Retourne le temps écoulé depuis le début de la session en format mm:ss
     *
     * @returns Le temps en format mm:ss
     */
    get formatedTimeElapsed(): string {
        const minutes = Math.floor(this.timeElapsed / TIME_CONST.minute);
        const seconds = this.timeElapsed % TIME_CONST.minute;
        return minutes + ':' + seconds.toString().padStart(2, '0');
    }

    /**
     * Retourne si la session est en solo ou multi-joueur
     *
     * @returns le nombre de joueurs dans la session
     */
    get isSolo(): boolean {
        return this.differencesFoundByPlayer.length === 1;
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
    tryGuess(guess: Coordinate, userSocketId: string): GuessResult {
        let diffNum: number;
        let diffPixelList: Coordinate[] = [];
        if (!this.differenceValidationService.validateGuess(guess)) throw new Error('Mauvais format de guess.');
        try {
            diffNum = this.differenceValidationService.checkDifference(guess.x, guess.y);
            if (diffNum !== undefined && !this.isDiffAlreadyFound(diffNum))
                diffPixelList = this.differenceValidationService.getDifferencePixelList(diffNum);
        } catch (error) {
            throw new Error(error.message);
        }

        const isCorrect = diffNum !== undefined && !this.isDiffAlreadyFound(diffNum);
        // Traitement des pénalités, le cas échéant
        if (isCorrect) {
            const index = this.getDiffTupleIndex(userSocketId);
            if (index !== undefined) {
                this.differencesFoundByPlayer[index][1].push(diffNum);
                this.nGuesses++;
            }
        } else this.nPenalties++;

        return this.buildGuessResult(isCorrect, diffPixelList);
    }

    getNotFoundDifferences(): Coordinate[][] {
        const notFoundDifferences: Coordinate[][] = [];
        this.differenceValidationService.differenceCoordLists.forEach((differenceCoord, index) => {
            if (!this.isDiffAlreadyFound(index)) {
                notFoundDifferences.push(differenceCoord);
            }
        });

        return notFoundDifferences;
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
            differencesByPlayer: [[this.differencesFoundByPlayer[0][0], this.differencesFoundByPlayer[0][1].length]],
            differencePixelList,
            winnerName: this.verifyGameWon(),
        };

        if (!this.isSolo) guessResult.differencesByPlayer.push([this.differencesFoundByPlayer[1][0], this.differencesFoundByPlayer[1][1].length]);

        return guessResult;
    }

    /**
     * Verifie si un joueur a gagne la partie
     *
     * @returns le socketId du joueur gagnant ou un string indiquant qu'il n'y a pas de gagnant
     */
    verifyGameWon(): string | undefined {
        if (this.isSolo) {
            if (this.nDifferences === this.differencesFoundByPlayer[0][1].length) return this.differencesFoundByPlayer[0][0];
            return;
        }

        if (this.nDifferences / 2 <= this.differencesFoundByPlayer[0][1].length) return this.differencesFoundByPlayer[0][0];
        if (this.nDifferences / 2 <= this.differencesFoundByPlayer[1][1].length) return this.differencesFoundByPlayer[1][0];
        return;
    }

    /**
     * handle clue request to apply penalty to session timer,
     * count the clue request and
     * verify if the session is allowed to give out any more clues
     *
     * @returns boolean that indicates if the clue is allowed
     */
    handleClueRequest(): boolean {
        this.nbCluesRequested++;
        const clueIsAllowed = this.nbCluesRequested <= 3;
        if (clueIsAllowed) this.timeElapsed += 5;
        return clueIsAllowed;
    }

    /**
     * Vérifie si une différence a déjà été trouvée
     *
     * @param differenceNum numéro (identifiant) de la différence à analyser
     * @returns si c'est une différence déjà trouvé ou non
     */
    private isDiffAlreadyFound(differenceNum: number) {
        if (this.isSolo) return this.differencesFoundByPlayer[0][1].includes(differenceNum);
        return this.differencesFoundByPlayer[0][1].includes(differenceNum) || this.differencesFoundByPlayer[1][1].includes(differenceNum);
    }

    /**
     * Retourne l'index de la liste de différences trouvée par un client spécifique
     *
     * @param userSocketId l'identifiant du socket de l'utilisateur
     * @returns l'index du tuple voulu dans this.differencFoundByPlayer
     */
    private getDiffTupleIndex(userSocketId: string): number | undefined {
        for (let i = 0; i < this.differencesFoundByPlayer.length; i++) {
            if (this.differencesFoundByPlayer[i][0] === userSocketId) return i;
        }
    }
}
