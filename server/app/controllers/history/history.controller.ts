import { HistoryDocument } from '@app/Schemas/history/history.schema';
import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GameHistory } from '@common/game-history';

/**
 * Controlleur d'historique'. Permet de gérer les requêtes HTTP pour l'historique des parties.
 */
@Controller('history')
export class HistoryController {
    constructor(@InjectModel('GameHistory') private history: Model<HistoryDocument>) {}

    /**
     * Ajoute une entrée d'historique à la base de données.
     *
     * @param newHistoryEntry entrée d'historique à ajouter
     * @returns si l'ajout a réussi
     */
    @Post()
    async addToHistory(@Body() newHistoryEntry: GameHistory): Promise<GameHistory> {
        if (!newHistoryEntry || !newHistoryEntry.gameId || !newHistoryEntry.playerOne || !newHistoryEntry.gameMode) {
            throw new HttpException('Données manquantes.', HttpStatus.BAD_REQUEST);
        }

        return await this.history.findOneAndUpdate(
            { gameId: newHistoryEntry.gameId, startDateTime: newHistoryEntry.startDateTime, gameMode: newHistoryEntry.gameMode },
            newHistoryEntry,
            {
                upsert: true,
            },
        );
    }

    /**
     * Retourne l'historique des parties d'un jeu.
     *
     * @param id id de la partie dont on veut l'historique
     * @returns la liste des entrées d'historique de la partie
     */
    @Get(':id')
    async getHistory(@Param('id') id: string): Promise<GameHistory[]> {
        if (!id) {
            throw new HttpException('Pas id maquant', HttpStatus.BAD_REQUEST);
        }
        return await this.history.find({ gameId: id });
    }

    /**
     * Supprime l'historique d'un jeu.
     *
     * @param gameID id de la partie dont on veut supprimer l'historique
     */
    @Delete(':id')
    async deleteHistory(@Param('id') gameID: string) {
        if (!gameID) {
            throw new HttpException('Pas id maquant', HttpStatus.BAD_REQUEST);
        }
        await this.history.deleteMany({ gameId: gameID });
    }
}
