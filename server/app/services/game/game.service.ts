import {
    DEFAULT_GAME_TIME,
    DEFAULT_PENALTY_TIME,
    DEFAULT_REWARD_TIME,
    DEFAULT_SCOREBOARD,
    GAME_DATA_FILE_PATH,
    GAME_ID_CAP,
    IMAGE_FOLDER_PATH,
    IMAGE_FORMAT,
} from '@app/services/constants/services.const';
import { DifferenceDetectionService } from '@app/services/difference-detection/difference-detection.service';
import { Game } from '@common/game';
import { ImageComparisonResult } from '@common/image-comparison-result';
import { InputGame } from '@common/input-game';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class GameService {
    private allGames: Game[] = [];

    constructor() {
        this.populate();
    }

    /**
     * @returns La liste de tous les jeux
     */
    findAll() {
        return this.allGames;
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

        let newGame: Game;
        if (result.isValid) {
            newGame = {
                id: undefined,
                name: inputGame.name,
                imageAlt: inputGame.imageAlt,
                imageMain: inputGame.imageMain,
                radius: inputGame.radius,
                isHard: result.isHard,
                isValid: result.isValid,
                differenceCount: result.differenceCount,
                scoreBoardSolo: [...DEFAULT_SCOREBOARD],
                scoreBoardMulti: [...DEFAULT_SCOREBOARD],
                time: DEFAULT_GAME_TIME,
                penalty: DEFAULT_PENALTY_TIME,
                reward: DEFAULT_REWARD_TIME,
            };

            const id = this.addToList(newGame);
            diffDetectionService.saveDifferences(id.toString());
            this.saveState();
        } else {
            throw new HttpException('Images choisies ne respectent pas les contraintes de jeu.', HttpStatus.BAD_REQUEST);
        }
        return newGame;
    }

    /**
     * Supprime un jeu de la persistance
     *
     * @param id L'identifiant du jeu à supprimer
     */
    delete(id: number) {
        const game = this.findById(id);
        if (!game) {
            throw new HttpException('Game ID non existant.', HttpStatus.NOT_FOUND);
        }
        const index = this.allGames.indexOf(game);
        this.allGames.splice(index, 1);
        this.saveState();
    }

    /**
     * Retourne un jeu d'un certain identifiant
     *
     * @param findID L'indentifiant du jeu recherché
     * @returns Le jeu recherché
     */
    findById(findID: number): Game {
        let returnGame: Game = null;
        this.allGames.forEach((game: Game) => {
            if (game.id === findID) {
                returnGame = game;
            }
        });
        return returnGame;
    }

    addToList(game: Game): number {
        game.id = undefined;

        while (game.id === undefined || this.findById(game.id) != null) {
            game.id = Math.floor(Math.random() * GAME_ID_CAP);
        }
        this.allGames.push(game);
        return game.id;
    }

    /**
     * Sauvegarde les jeux en persistance
     */
    saveState() {
        const allGamesData = JSON.stringify(this.allGames);
        fs.writeFileSync(GAME_DATA_FILE_PATH, allGamesData);
    }

    /**
     * Charge les jeux de la persistance
     */
    populate() {
        try {
            const data = fs.readFileSync(GAME_DATA_FILE_PATH);
            this.allGames = JSON.parse(data.toString());
        } catch (err) {
            throw new Error('Erreur en lecture de fichier');
        }
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
}
