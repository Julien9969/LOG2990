import { ONE_PLAYER } from '@app/services/constants/services.const';
import { DifferenceValidationService } from '@app/services/difference-validation/difference-validation.service';
import { GameService } from '@app/services/game/game.service';
import { Coordinate } from '@common/coordinate';
import { Game } from '@common/game';
import { GuessResult } from '@common/guess-result';
import { Player } from '@common/player';
import { Session } from './session';

export class LimitedTimeSession extends Session {
    gameService: GameService;
    differenceValidationService: DifferenceValidationService = new DifferenceValidationService();
    playedGames: string[] = [];
    nDifferencesFound: number = 0;

    constructor(gameService: GameService, players: Player[]) {
        super();
        const gameConsts = gameService.getGameConstants();
        this.gameService = gameService;
        this.players = players;
        this.time = gameConsts.time;
        this.penalty = gameConsts.penalty;
        // if (!mongoose.isValidObjectId(gameID)) throw new Error('Invalid gameID for session create');
        // this.decideNewGame();
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

    get allGameDifferences(): Coordinate[][] {
        return this.differenceValidationService.differenceCoordLists;
    }

    /**
     * Traite un essai de différence du jeu dans la session courante
     *
     * @param guess La coordonnée de l'essai
     * @returns Le résultat de l'essai
     */
    // TODO:
    async tryGuess(guess: Coordinate, socketId: string): Promise<GuessResult> {
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
        let newGame: Game = await this.gameService.getRandomGame();
        if (await this.noMoreGames()) {
            return undefined;
        }
        while (this.hasGameBeenPlayed(newGame)) {
            newGame = await this.gameService.getRandomGame();
        }
        this.playedGames.push(newGame.id);
        this.gameID = newGame.id;
        try {
            this.differenceValidationService.loadDifferences(this.gameID.toString());
        } catch (e: unknown) {
            return await this.decideNewGame();
        }
        return newGame;
    }

    hasGameBeenPlayed(game: Game): boolean {
        return (
            this.playedGames.find((value) => {
                return game.id === value;
            }) !== undefined
        );
    }

    async noMoreGames(): Promise<boolean> {
        const allGames: Game[] = await this.gameService.findAll();
        const unPlayedGames: Game[] = allGames.filter((game: Game) => {
            return !this.playedGames.includes(game.id);
        });
        if (unPlayedGames.length === 0) return true;
        return false;
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

    /**
     * Applique la penalité sur le temps, compte l'indice au
     * total des indices permis et verifie si la session est
     * permise de donner plus d'indices
     *
     * @returns boolean qui indique si la demande d'indice est approuvée
     */
    handleClueRequest(): boolean {
        const clueIsAllowed = ++this.nbCluesRequested <= 3;
        if (clueIsAllowed) {
            this.time -= 5;
        }
        return clueIsAllowed;
    }
}
