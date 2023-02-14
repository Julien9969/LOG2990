import { GameService } from '@app/services/game/game.service';
import { Utils } from '@app/services/utils/utils.service';
import { Game } from '@common/game';
import { InputGame } from '@common/input-game';
import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';

/**
 * Controlleur de games. Les jeux crées sont permanents et la synchronisation entre la memoire serveur et la permanence est automatique
 */
@Controller('games')
export class GamesController {
    constructor(private readonly gameService: GameService) {}

    /**
     * Crée un nouveau jeu avec les informations fournies
     *
     * @returns le nouveau jeu créé, avec son ID généré
     */
    @Post()
    async newGame(@Body() inputGame: InputGame) {
        if (!inputGame || !inputGame.name) {
            throw new HttpException('Nom du jeu absent.', HttpStatus.BAD_REQUEST);
        }
        let game: Game;

        try {
            game = await this.gameService.create(inputGame);
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
    getAllGames() {
        return this.gameService.findAll();
    }

    /**
     * Obtient les informations d'un jeu.
     *
     * @param params L'identifiant du jeu cherché
     * @returns Le jeu
     */
    @Get(':id')
    getGame(@Param('id') id: string) {
        const game = this.gameService.findById(Utils.convertToInt(id));
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
    deleteById(@Param('id') id: string) {
        this.gameService.delete(Utils.convertToInt(id));
    }
}
