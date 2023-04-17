import { DifferenceValidationService } from '@app/services/difference-validation/difference-validation.service';
import { GameService } from '@app/services/game/game.service';
import { Coordinate } from '@common/coordinate';
import { Game } from '@common/game';
import { GuessResult } from '@common/guess-result';
import { Player } from '@common/player';
import { ONE_PLAYER } from '../constants/services.const';
import { Session } from './session';

export class LimitedTimeSession extends Session {
    gameService: GameService;
    differenceValidationService: DifferenceValidationService = new DifferenceValidationService();
    playedGames: Game[] = [];
    nDifferencesFound: number = 0;

    constructor(gameService: GameService, players: Player[]) {
        super();
        this.gameService = gameService;
        this.players = players;
        this.time = gameService.getGameConstants().time;
        this.isTimeLimited = true;
    }

    /**
     * Retourne si la session est en solo ou multi-joueur
     *
     * @returns le nombre de joueurs dans la session
     */
    get isSolo(): boolean {
        return this.players.length === 1;
    }

    /**
     * Traite un essai de différence du jeu dans la session courante
     *
     * @param guess La coordonnée de l'essai
     * @returns Le résultat de l'essai
     */
    // TO DO:
    // eslint-disable-next-line no-unused-vars
    async tryGuess(guess: Coordinate, _socketId: string): Promise<GuessResult> {
        if (!this.differenceValidationService.validateGuess(guess)) throw new Error('Mauvais format de guess.');
        let isCorrect = false;
        let diffPixelList: Coordinate[] = [];
        const diffNum: number = this.differenceValidationService.checkDifference(guess.x, guess.y);
        isCorrect = diffNum !== undefined;
        if (isCorrect) {
            this.nDifferencesFound += 1;
            diffPixelList = this.differenceValidationService.getDifferencePixelList(diffNum);
        }
        // Traitement des pénalités, le cas échéant
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
    async decideNewGame(): Promise<Game> {
        console.log('a new game was decided for this session');
        let newGame: Game = await this.gameService.getRandomGame();
        if (await this.noMoreGames()) {
            return undefined;
        }
        while (this.hasGameBeenPlayed(newGame)) {
            newGame = await this.gameService.getRandomGame();
        }
        this.playedGames.push(newGame);
        this.gameID = newGame.id;
        try {
            this.differenceValidationService.loadDifferences(this.gameID.toString());
        } catch (e: unknown) {
            console.log('on a eu une erreure avec le dernier jeu');
            return this.decideNewGame();
        }
        return newGame;
    }

    hasGameBeenPlayed(game: Game): boolean {
        return (
            this.playedGames.find((value) => {
                return game.id === value.id;
            }) !== undefined
        );
    }

    async noMoreGames(): Promise<boolean> {
        return this.playedGames.length === (await this.gameService.getNumberOfGames());
    }

    timerFinished(): boolean {
        return this.time <= 0;
    }

    deletePlayer(socketId: string) {
        let playerToRemove = -1;
        if (socketId === this.players[0].socketId) playerToRemove = 0;
        else playerToRemove = 1;
        this.players.splice(playerToRemove, ONE_PLAYER);
    }
}
