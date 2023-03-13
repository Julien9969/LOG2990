import { DifferenceValidationService } from '@app/services/difference-validation/difference-validation.service';
import { Coordinate } from '@common/coordinate';
import { GuessResult } from '@common/guess-result';
import { NewScore } from '@common/new-score';

export class Session {
    gameID: string;
    id: number;
    nGuesses: number = 0;
    nPenalties: number = 0;
    nDifferences: number;
    differenceValidationService: DifferenceValidationService = new DifferenceValidationService();
    differencesFoundByPlayer: [userSocketId: string, differencesFound: number[]][] = [];

    constructor(gameID: string, firstSocketId: string, secondSocketId?: string) {
        this.differencesFoundByPlayer.push([firstSocketId, []]);
        if (secondSocketId) {
            this.differencesFoundByPlayer.push([secondSocketId, []]);
        }
        this.gameID = gameID;
        this.differenceValidationService.loadDifferences(this.gameID.toString());
        this.nDifferences = this.differenceValidationService.differenceCoordLists.length;
    }

    /**
     * Retourne le nombre de joueurs se trouvant dans cette session
     *
     * @returns le nombre de joueurs dans la session
     */
    getNbPlayers() {
        return this.differencesFoundByPlayer.length;
    }

    /**
     * Traite un essai de différence du jeu dans la session courante
     *
     * @param guess La coordonnée de l'essai
     * @returns Le résultat de l'essai
     */
    tryGuess(guess: Coordinate, userSocketId: string): NewScore {
        let diffNum: number;
        let diffPixelList: Coordinate[] = [];
        if (!this.differenceValidationService.validateGuess(guess)) {
            throw new Error('Mauvais format de guess.');
        }
        try {
            // Vérification de la différence dans les données de jeu
            diffNum = this.differenceValidationService.checkDifference(guess.x, guess.y);
            if (diffNum !== undefined && !this.isDiffAlreadyFound(diffNum)) {
                diffPixelList = this.differenceValidationService.getDifferencePixelList(diffNum);
            }
        } catch (error) {
            throw new Error(error.message);
        }

        // Formation de l'objet resultat
        const result: GuessResult = {
            isCorrect: diffNum !== undefined && !this.isDiffAlreadyFound(diffNum),
            differencesByPlayer: [],
            differencePixelList: diffPixelList,
        };

        // Traitement des pénalités, le cas échéant
        if (result.isCorrect) {
            const index = this.getDiffTupleIndex(userSocketId);
            if (index !== undefined) {
                this.differencesFoundByPlayer[index][1].push(diffNum);
                this.nGuesses++;
            }
        } else {
            this.nPenalties++;
        }
        result.differencesByPlayer.push([this.differencesFoundByPlayer[0][0], this.differencesFoundByPlayer[0][1].length]);
        if (this.differencesFoundByPlayer.length === 2) {
            result.differencesByPlayer.push([this.differencesFoundByPlayer[1][0], this.differencesFoundByPlayer[1][1].length]);
        }
        const newScore: NewScore = {
            guessResult: result,
            gameWonBy: this.verifyGameWon(),
        };
        return newScore;
    }
    /**
     * Verifie si un joueur a gagne la partie
     *
     * @returns le socketId du joueur gagnant ou une string vide
     */
    verifyGameWon(): string {
        if (this.differencesFoundByPlayer.length === 1) {
            if (this.nDifferences === this.differencesFoundByPlayer[0][1].length) {
                return this.differencesFoundByPlayer[0][0];
            } else return 'No winner';
        } else if (this.nDifferences / 2 <= this.differencesFoundByPlayer[0][1].length) {
            // console.log('Player a gagne la game yessir')
            return this.differencesFoundByPlayer[0][0];
        } else if (this.nDifferences / 2 <= this.differencesFoundByPlayer[1][1].length) {
            return this.differencesFoundByPlayer[1][0];
        } else {
            return 'No winner';
        }
    }

    /**
     * Vérifie si une différence a déjà été trouvée
     *
     * @param differenceNum numéro (identifiant) de la différence à analyser
     * @returns si c'est une différence déjà trouvé ou non
     */
    private isDiffAlreadyFound(differenceNum: number) {
        for (const differenceList of this.differencesFoundByPlayer) {
            if (differenceList[1].includes(differenceNum)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Retourne l'index de la liste de différences trouvée par un client spécifique
     *
     * @param userSocketId l'identifiant du socket de l'utilisateur
     * @returns l'index du tuple voulu dans this.differencFoundByPlayer
     */
    private getDiffTupleIndex(userSocketId: string): number | undefined {
        for (let i = 0; i < this.differencesFoundByPlayer.length; i++) {
            if (this.differencesFoundByPlayer[i][0] === userSocketId) {
                return i;
            }
        }
    }
}
