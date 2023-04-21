import { GameService } from '@app/services/game/game.service';
import { Coordinate } from '@common/coordinate';
import { GuessResult } from '@common/guess-result';
import { Player } from '@common/player';
import mongoose from 'mongoose';
import { Session } from './session';

export class ClassicSession extends Session {
    nDifferences: number = 0;
    constructor(gameService: GameService, gameID: string, players: Player[]) {
        super();
        this.players = players;
        if (!mongoose.isValidObjectId(gameID)) throw new Error('Invalid gameID for session create');
        this.gameID = gameID;
        this.differenceValidationService.loadDifferences(this.gameID.toString());
        this.nDifferences = this.differenceValidationService.differenceCoordLists.length;
        this.time = 0;
        this.isTimeLimited = false;
        this.penalty = gameService.getGameConstants().penalty;
    }

    /**
     * Traite un essai de différence du jeu dans la session courante
     *
     * @param guess La coordonnée de l'essai
     * @returns Le résultat de l'essai
     */
    tryGuess(guess: Coordinate, socketId: string): GuessResult {
        let diffNum: number;
        let diffPixelList: Coordinate[] = [guess];
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
            const index = this.getDiffTupleIndex(socketId);
            if (index !== undefined) {
                this.players[index].differencesFound.push(diffNum);
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
            differencesByPlayer: [[this.players[0].socketId, this.players[0].differencesFound.length]],
            differencePixelList,
            winnerName: this.verifyGameWon(),
        };

        if (!this.isSolo) guessResult.differencesByPlayer.push([this.players[1].socketId, this.players[1].differencesFound.length]);
        return guessResult;
    }

    /**
     * Verifie si un joueur a gagne la partie
     *
     * @returns le socketId du joueur gagnant ou un string indiquant qu'il n'y a pas de gagnant
     */
    verifyGameWon(): string | undefined {
        if (this.isSolo) {
            if (this.nDifferences === this.players[0].differencesFound.length) return this.players[0].socketId;
            return;
        }

        if (this.nDifferences / 2 <= this.players[0].differencesFound.length) return this.players[0].socketId;
        if (this.nDifferences / 2 <= this.players[1].differencesFound.length) return this.players[1].socketId;
        return;
    }

    /**
     * Applique la penalité sur le temps, compte l'indice au
     * total des indices permis et verifie si la session est
     * permise de donner plus d'indices
     *
     * @returns boolean qui indique si la demande d'indice est approuvée
     */
    handleClueRequest(): boolean {
        this.nbCluesRequested++;
        const clueIsAllowed = this.nbCluesRequested <= 3;
        if (clueIsAllowed) this.time += this.penalty;
        return clueIsAllowed;
    }

    /**
     * Vérifie si une différence a déjà été trouvée
     *
     * @param differenceNum numéro (identifiant) de la différence à analyser
     * @returns si c'est une différence déjà trouvé ou non
     */
    private isDiffAlreadyFound(differenceNum: number) {
        if (this.isSolo) return this.players[0].differencesFound.includes(differenceNum);
        return this.players[0].differencesFound.includes(differenceNum) || this.players[1].differencesFound.includes(differenceNum);
    }

    /**
     * Retourne l'index de la liste de différences trouvée par un client spécifique
     *
     * @param userSocketId l'identifiant du socket de l'utilisateur
     * @returns l'index du tuple voulu dans this.differencFoundByPlayer
     */
    private getDiffTupleIndex(userSocketId: string): number | undefined {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].socketId === userSocketId) return i;
        }
    }
}
