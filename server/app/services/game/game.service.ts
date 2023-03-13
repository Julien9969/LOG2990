import { GameDocument } from '@app/Schemas/game/game.schema';
import {
    DEFAULT_GAME_TIME,
    DEFAULT_PENALTY_TIME,
    DEFAULT_REWARD_TIME,
    DEFAULT_SCOREBOARD,
    DIFFERENCE_IMAGES_FOLDER,
    DIFFERENCE_IMAGES_PREFIX,
    DIFFERENCE_LISTS_FOLDER,
    DIFFERENCE_LISTS_PREFIX,
    IMAGE_FOLDER_PATH,
    // bug de prettier qui rentre en conflit avec eslint (pas de virgule pour le dernier élément d'un tableau)
    // eslint-disable-next-line prettier/prettier
    IMAGE_FORMAT
} from '@app/services/constants/services.const';
import { DifferenceDetectionService } from '@app/services/difference-detection/difference-detection.service';
import { ImageService } from '@app/services/images/image.service';
import { FinishedGame } from '@common/finishedGame';
import { Game, UnsavedGame } from '@common/game';
import { ImageComparisonResult } from '@common/image-comparison-result';
import { InputGame } from '@common/input-game';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as fs from 'fs';
import mongoose, { Model } from 'mongoose';

@Injectable()
export class GameService {
    prototype: unknown;
    constructor(@InjectModel('Game') private gameModel: Model<GameDocument>, private readonly imageService: ImageService) {}

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
    async create(inputGame: InputGame): Promise<Game> {
        const diffDetectionService = new DifferenceDetectionService();
        let result: ImageComparisonResult;
        try {
            result = await this.compareImages(inputGame, diffDetectionService);
        } catch (err) {
            throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        }
        if (!result.isValid) {
            throw new HttpException('Images choisies ne respectent pas les contraintes de jeu.', HttpStatus.BAD_REQUEST);
        }

        const newGame: UnsavedGame = {
            ...inputGame,
            isHard: result.isHard,
            isValid: result.isValid,
            differenceCount: result.differenceCount,
            scoreBoardSolo: [...DEFAULT_SCOREBOARD],
            scoreBoardMulti: [...DEFAULT_SCOREBOARD],
            time: DEFAULT_GAME_TIME,
            penalty: DEFAULT_PENALTY_TIME,
            reward: DEFAULT_REWARD_TIME,
        };

        const createdGame: Game = await this.gameModel.create(newGame);
        diffDetectionService.saveDifferences(createdGame.id);
        return createdGame;
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
        this.imageService.deleteImage(game.imageMain);
        this.imageService.deleteImage(game.imageAlt);
        fs.unlinkSync(`${DIFFERENCE_IMAGES_FOLDER}/${DIFFERENCE_IMAGES_PREFIX}${game.id}.bmp`);
        fs.unlinkSync(`${DIFFERENCE_LISTS_FOLDER}/${DIFFERENCE_LISTS_PREFIX}${game.id}.json`);
        await this.gameModel.deleteOne({ _id: id });
    }

    /**
     * Retourne un jeu d'un certain identifiant
     *
     * @param findID L'indentifiant du jeu recherché
     * @returns Le jeu recherché
     */
    async findById(findID: string): Promise<Game> {
        this.verifyGameId(findID);
        const gameDocument = await this.gameModel.findOne({ _id: findID });
        return gameDocument;
    }

    /**
     * Compare 2 images pour confirmer leur validité en jeu
     *
     * @param game Les informations du jeu
     * @param diffDetectionService L'instance du système de détection de différence
     * @returns Le résultat de la comparaison d'images
     */
    async compareImages(game: InputGame, diffDetectionService: DifferenceDetectionService): Promise<ImageComparisonResult> {
        if (game.imageAlt === undefined || game.imageMain === undefined || game.radius === undefined) {
            throw new Error('Le jeu nécessite une image ou rayon.');
        }
        const imageMainPath: string = IMAGE_FOLDER_PATH + '/' + game.imageMain + '.' + IMAGE_FORMAT;
        const imageAltPath: string = IMAGE_FOLDER_PATH + '/' + game.imageAlt + '.' + IMAGE_FORMAT;

        await diffDetectionService.compareImagePaths(imageMainPath, imageAltPath, game.radius);
        const result: ImageComparisonResult = diffDetectionService.getComparisonResult();

        return result;
    }

    async getSoloScoreboard(id: string) {
        const game: Game = await this.findById(id);
        return game.scoreBoardSolo;
    }

    async getMultiScoreboard(id: string) {
        const game: Game = await this.findById(id);
        return game.scoreBoardMulti;
    }

    async addToScoreboard(gameId: string, finishedGame: FinishedGame) {
        let scoreBoard;
        if (finishedGame.solo) scoreBoard = await this.getSoloScoreboard(gameId);
        else scoreBoard = await this.getMultiScoreboard(gameId);
        if (finishedGame.time < scoreBoard[2][1]) {
            scoreBoard[2] = [finishedGame.winner, finishedGame.time];
        }
        scoreBoard.sort((a, b) => {
            return a[1] - b[1];
        });
    }

    verifyGameId(id: string): void {
        if (!mongoose.isValidObjectId(id)) {
            throw new Error(`Le ID "${id}" n'est pas un ID valide (format non-valide)`);
        }
    }
}
