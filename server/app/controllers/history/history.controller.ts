import { HistoryDocument } from '@app/Schemas/history/history.schema';
import { GameHistory } from '@common/game-history';
import { Body, Controller, Delete, Get, HttpException, HttpStatus, Post } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

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
        if (this.isInvalideHistoryEntry(newHistoryEntry)) {
            throw new HttpException('Données manquantes.', HttpStatus.BAD_REQUEST);
        }
        try {
            return await this.history.findOneAndUpdate({ gameId: newHistoryEntry.gameId, gameMode: newHistoryEntry.gameMode }, newHistoryEntry, {
                upsert: true,
            });
        } catch (error) {
            throw new HttpException("Erreur lors de l'ajout de l'historique.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retourne l'historique des parties d'un jeu.
     *
     * @param id id de la partie dont on veut l'historique
     * @returns la liste des entrées d'historique de la partie
     */
    @Get()
    async getHistory(): Promise<GameHistory[]> {
        try {
            return await this.history.find({});
        } catch (error) {
            throw new HttpException("Erreur lors de la récupération de l'historique.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Supprime l'historique d'un jeu.
     *
     * @param gameID id de la partie dont on veut supprimer l'historique
     */
    @Delete()
    async deleteHistory() {
        try {
            await this.history.deleteMany({});
        } catch (error) {
            throw new HttpException("Erreur lors de la suppression de l'historique.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Vérifie la validité d'une entrée
     *
     * @param newHistoryEntry la nouvelle entrée à persisté
     * @returns un boolean vrai si l'entrée est valide, faux si l'entrée est invalide
     */
    private isInvalideHistoryEntry(newHistoryEntry: GameHistory): boolean {
        return !newHistoryEntry || !newHistoryEntry.gameId || !newHistoryEntry.playerOne || !newHistoryEntry.gameMode;
    }
}
