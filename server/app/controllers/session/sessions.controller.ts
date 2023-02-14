import { GameService } from '@app/services/game/game.service';
import { SessionService } from '@app/services/session/session.service';
import { Utils } from '@app/services/utils/utils.service';
import { Coordinate } from '@common/coordinate';
import { GuessResult } from '@common/guess-result';
import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';

@Controller('session')
export class SessionController {
    constructor(private readonly sessionService: SessionService, private readonly gameService: GameService) {}

    /**
     * Récupérer toutes les sessions de jeu active
     *
     * @returns La liste des sessions de jeu
     */
    @Get()
    getAllActiveSession() {
        return this.sessionService.getAll();
    }

    /**
     * Récupère les informations d'une session en cours
     *
     * @param id L'identifiant de la session
     * @returns La session recherchée
     */
    @Get(':id')
    getSession(@Param('id') id: string) {
        const sessionId = Utils.convertToInt(id);
        const session = this.sessionService.findById(sessionId);
        if (!session) {
            throw new HttpException('Session non existante.', HttpStatus.NOT_FOUND);
        }
        return session;
    }

    /**
     * Crée une session d'un certain jeu choisi
     *
     * @param stringId La chaine contenant l'identifiant de jeu qu'on veut jouer
     * @returns L'identifiant de la session créée
     */
    @Post('/:gameId')
    newGame(@Param('gameId') stringId: string) {
        const gameId = Utils.convertToInt(stringId);
        if (!this.gameService.findById(gameId)) {
            throw new HttpException('Jeu non existant.', HttpStatus.NOT_FOUND);
        }
        const sessionId = this.sessionService.create(gameId);
        return sessionId;
    }

    /**
     * Permet de fermer une session
     *
     * @param id L'identifiant de la session à supprimer
     */
    @Delete('/:id')
    deleteGame(@Param('id') id: string) {
        const sessionId = Utils.convertToInt(id);
        this.sessionService.delete(sessionId);
    }

    /**
     * Traite un essai de recherche de différence
     *
     * @param id L'identifiant de la session jouée
     * @param body Les coordonnées de l'essai
     * @returns Le résultat de l'essai de recherche de différence
     */
    @Post('/:id/guess')
    guess(@Param('id') id: string, @Body() body: Coordinate) {
        const sessionId = Utils.convertToInt(id);
        const session = this.sessionService.findById(sessionId);
        let result: GuessResult;

        if (!session) {
            throw new HttpException('Session non existante.', HttpStatus.NOT_FOUND);
        }
        try {
            result = session.tryGuess(body);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
        return result;
    }
}
