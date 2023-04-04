import { GameConstantsInput } from '@app/interfaces/game-constants-input';
import { GameImageInput } from '@app/interfaces/game-image-input';
import { GameService } from '@app/services/game/game.service';
import { Utils } from '@app/services/utils/utils.service';
import { Game } from '@common/game';
import { InputGame } from '@common/input-game';
import { Body, Controller, Delete, Get, HttpException, HttpStatus, Logger, Param, Patch, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

/**
 * Controlleur de games. Les jeux crées sont permanents et la synchronisation entre la memoire serveur et la permanence est automatique
 */
@Controller('games')
export class GamesController {
    constructor(private readonly gameService: GameService, private readonly logger: Logger) {}

    /**
     * Crée un nouveau jeu avec les informations fournies
     *
     * @returns le nouveau jeu créé, avec son ID généré
     */
    @Post()
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'mainFile', maxCount: 1 },
            { name: 'altFile', maxCount: 1 },
        ]),
    )
    async newGame(@Body() input: { name: string; radius: string }, @UploadedFiles() files: GameImageInput): Promise<Game> {
        if (!input || !input.name) {
            throw new HttpException('Nom du jeu absent.', HttpStatus.BAD_REQUEST);
        }
        if (!files || !files.mainFile || !files.altFile || input.radius === undefined) {
            throw new HttpException('Le jeu necessite 2 images et un rayon.', HttpStatus.BAD_REQUEST);
        }

        // Conversion de type du rayon, puisque les forms html envoient des string
        const inputGame: InputGame = {
            name: input.name,
            radius: Utils.convertToInt(input.radius),
        };

        let game: Game;
        try {
            const mainImageBuffer = files.mainFile[0].buffer;
            const altImageBuffer = files.altFile[0].buffer;
            game = await this.gameService.create(inputGame, mainImageBuffer, altImageBuffer);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
        return game;
    }

    /**
     * Retourne la liste complète de jeux
     *
     * @returns La liste de tous les Game dans la persistance.
     */
    @Get()
    async getAllGames() {
        return await this.gameService.findAll();
    }

    @Get('constants')
    getGameConstants() {
        return this.gameService.constants;
    }

    /**
     * Obtient les informations d'un jeu.
     *
     * @param params L'identifiant du jeu cherché
     * @returns Le jeu
     */
    @Get(':id')
    async getGame(@Param('id') id: string) {
        const game = await this.gameService.findById(id);
        if (game) {
            return game;
        } else {
            throw new HttpException('Jeu ' + id + ' non existant.', HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Detruit un element jeu specifique, dans la memoire de la session et dans la persistance
     *
     * @param params une id de l'element game a detruire
     */
    @Delete(':id')
    async deleteById(@Param('id') id: string) {
        try {
            await this.gameService.delete(id);
        } catch (e: unknown) {
            if (e instanceof Error) this.logger.error(e.message);
        }
    }

    /**
     * Modifie les constantes de jeu globales (temps d'une partie en temps limité, pénalité d'indice et bonus de différence trouvée)
     *
     * @param gameConstsInput Les valeurs modifiees de constantes de jeu
     */
    @Patch('constants')
    async configureConstants(@Body() gameConstsInput: GameConstantsInput) {
        if (!gameConstsInput) {
            throw new HttpException('Il manque un corps dans la requete', HttpStatus.BAD_REQUEST);
        }

        try {
            this.gameService.updateConstants(gameConstsInput);
        } catch (err) {
            throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        }
    }
}
