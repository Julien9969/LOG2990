import { GameDocument } from '@app/Schemas/game/game.schema';
import { HistoryDocument } from '@app/Schemas/history/history.schema';
import { MatchmakingGateway } from '@app/gateway/match-making/match-making.gateway';
import { GameConstants } from '@app/interfaces/game-constants';
import {
    DEFAULT_GAME_LEADERBOARD,
    DEFAULT_GAME_TIME,
    DEFAULT_PENALTY_TIME,
    DEFAULT_REWARD_TIME,
    DIFFERENCE_LISTS_FOLDER,
    // bug de prettier qui rentre en conflit avec eslint (pas de virgule pour le dernier élément d'un tableau)
    // eslint-disable-next-line prettier/prettier
    DIFFERENCE_LISTS_PREFIX,
    GAME_CONSTS_PATH,
    MAX_GAME_TIME,
    MAX_PENALTY_TIME,
    MAX_REWARD_TIME,
    MIN_GAME_TIME,
    MIN_PENALTY_TIME,
    MIN_REWARD_TIME,
} from '@app/services/constants/services.const';
import { DifferenceDetectionService } from '@app/services/difference-detection/difference-detection.service';
import { ImageService } from '@app/services/images/image.service';
import { Utils } from '@app/services/utils/utils.service';
import { FinishedGame } from '@common/finishedGame';
import { Game, UnsavedGame } from '@common/game';
import { GameConstantsInput } from '@common/game-constants-input';
import { ImageComparisonResult } from '@common/image-comparison-result';
import { InputGame } from '@common/input-game';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as fs from 'fs';
import mongoose, { Model } from 'mongoose';

@Injectable()
export class GameService {
    prototype: unknown;
    
    private globalGameConstants : GameConstants;
    
    // eslint-disable-next-line max-params -- Nécessaire pour le fonctionnement
    constructor(
        @InjectModel('Game') private gameModel: Model<GameDocument>,
        @InjectModel('GameHistory') private history: Model<HistoryDocument>,
        private readonly imageService: ImageService,
        private readonly matchMakingGateway: MatchmakingGateway,
    ) {
        this.loadGameConstants();
    }

    /**
     * @returns La liste de tous les jeux
     */
    async findAll(): Promise<Game[]> {
        return await this.gameModel.find();
    }

    /**
     * Crée un jeu et le sauvegarde en persistance
     *
     * @param inputGame Les informations du jeu
     * @returns Le jeu créé
     */
    async create(inputGame: InputGame, mainImageBuffer: Buffer, altImageBuffer: Buffer): Promise<Game> {
        const diffDetectionService = new DifferenceDetectionService();
        let result: ImageComparisonResult;
        try {
            result = await this.compareImages(inputGame, mainImageBuffer, altImageBuffer, diffDetectionService);
        } catch (err) {
            throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        }
        if (!result.isValid) throw new HttpException('Images choisies ne respectent pas les contraintes de jeu.', HttpStatus.BAD_REQUEST);
        const mainImageId = this.imageService.saveImage(mainImageBuffer);
        const altImageId = this.imageService.saveImage(altImageBuffer);

        const newGame: UnsavedGame = {
            ...inputGame,
            imageMain: mainImageId,
            imageAlt: altImageId,
            isHard: result.isHard,
            isValid: result.isValid,
            differenceCount: result.differenceCount,
            scoreBoardSolo: DEFAULT_GAME_LEADERBOARD,
            scoreBoardMulti: DEFAULT_GAME_LEADERBOARD,
        };

        return this.saveGameInDatabase(newGame, diffDetectionService);
    }

    /**
     * Supprime un jeu de la persistance
     *
     * @param id L'identifiant du jeu à supprimer
     */
    async delete(id: string) {
        this.verifyGameId(id);
        const game = await this.findById(id);
        if (!game) {
            throw new HttpException(`Le jeu avec le id ${id} n'existe pas`, HttpStatus.NOT_FOUND);
        }
        try {
            await this.gameModel.deleteOne({ _id: id });
            await this.history.deleteMany({ gameId: id });
        } catch (err) {
            throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        this.imageService.deleteImage(game.imageMain);
        this.imageService.deleteImage(game.imageAlt);
        fs.unlinkSync(`${DIFFERENCE_LISTS_FOLDER}/${DIFFERENCE_LISTS_PREFIX}${game.id}.json`);

        this.matchMakingGateway.notifyGameDeleted(id);
    }

    /**
     * Retourne un jeu d'un certain identifiant
     *
     * @param findID L'indentifiant du jeu recherché
     * @returns Le jeu recherché
     */
    async findById(findID: string): Promise<Game> {
        this.verifyGameId(findID);
        try {
            return await this.gameModel.findOne({ _id: findID });
        } catch (err) {
            throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Compare 2 images pour confirmer leur validité en jeu
     *
     * @param game Les informations du jeu
     * @param diffDetectionService L'instance du système de détection de différence
     * @returns Le résultat de la comparaison d'images
     */
    // (paramêtres sont nécessaires)
    // eslint-disable-next-line max-params
    async compareImages(
        game: InputGame,
        mainImageBuffer: Buffer,
        altImageBuffer: Buffer,
        diffDetectionService: DifferenceDetectionService,
    ): Promise<ImageComparisonResult> {
        if (!mainImageBuffer || !altImageBuffer || game.radius === undefined) {
            throw new Error('Le jeu nécessite une image ou rayon.');
        }

        await diffDetectionService.compareImages(mainImageBuffer, altImageBuffer, game.radius);

        return diffDetectionService.getComparisonResult();
    }

    async getSoloScoreboard(id: string) {
        const game: Game = await this.findById(id);
        return game ? game.scoreBoardSolo : null;
    }

    async getMultiScoreboard(id: string) {
        const game: Game = await this.findById(id);
        return game ? game.scoreBoardMulti : null;
    }

    async addToScoreboard(gameId: string, finishedGame: FinishedGame) {
        const scoreBoard: [string, number][] = finishedGame.solo ? await this.getSoloScoreboard(gameId) : await this.getMultiScoreboard(gameId);

        if (!scoreBoard) return;

        scoreBoard.push([finishedGame.winner, finishedGame.time]);
        scoreBoard.sort((a, b) => {
            return a[1] - b[1];
        });
        if (scoreBoard.length > 3) scoreBoard.pop();

        try {
            this.gameModel.updateOne({ _id: gameId }, finishedGame.solo ? { scoreBoardSolo: scoreBoard } : { scoreBoardMulti: scoreBoard }).exec();
        } catch (err) {
            throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Valide et modifie les constantes de jeu en persistance
     *
     * @param gameConstsInput Les valeurs modifiees de constantes de jeu
     */
    updateConstants(gameConstsInput: GameConstantsInput) {
        const gameConsts: GameConstants = { ...this.globalGameConstants };

        // Comparaison a undefined puisque les parametres sont optionnels
        if (gameConstsInput.time !== undefined) gameConsts.time = Utils.convertToInt(gameConstsInput.time);
        if (gameConstsInput.penalty !== undefined) gameConsts.penalty = Utils.convertToInt(gameConstsInput.penalty);
        if (gameConstsInput.reward !== undefined) gameConsts.reward = Utils.convertToInt(gameConstsInput.reward);

        if (this.validateGameConstants(gameConsts)) {
            this.globalGameConstants = gameConsts;
            this.saveGameConstants();
        } else {
            throw new Error('Constantes de jeu invalides');
        }
    }

    private loadGameConstants() {
        try {
            const constantsRead = fs.readFileSync(GAME_CONSTS_PATH).toString();
            this.globalGameConstants = JSON.parse(constantsRead);
        } catch (err) {
            this.globalGameConstants = {
                time: DEFAULT_GAME_TIME,
                reward: DEFAULT_REWARD_TIME,
                penalty: DEFAULT_PENALTY_TIME,
            };
        }
    }

    private saveGameConstants() {
        const constantsContent = JSON.stringify(this.globalGameConstants);
        try {
            fs.writeFileSync(GAME_CONSTS_PATH, constantsContent);
        } catch (err) {
            throw new Error('Erreur lors de la sauvegarde des constantes de jeu');
        }
    }

    private validateGameConstants(gameConsts: GameConstants): boolean {
        return (
            gameConsts.time >= MIN_GAME_TIME &&
            gameConsts.time <= MAX_GAME_TIME &&
            gameConsts.penalty >= MIN_PENALTY_TIME &&
            gameConsts.penalty <= MAX_PENALTY_TIME &&
            gameConsts.reward >= MIN_REWARD_TIME &&
            gameConsts.reward <= MAX_REWARD_TIME
        );
    }

    private verifyGameId(id: string): void {
        if (!mongoose.isValidObjectId(id)) {
            throw new Error(`Le ID "${id}" n'est pas un ID valide (format non-valide)`);
        }
    }

    private async saveGameInDatabase(newGame: UnsavedGame, diffDetectionService: DifferenceDetectionService) {
        let createdGame: Game;
        try {
            createdGame = await this.gameModel.create(newGame);
        } catch (err) {
            throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        diffDetectionService.saveDifferenceLists(createdGame.id);
        return createdGame;
    }
}
