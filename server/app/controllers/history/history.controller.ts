import { HistoryDocument } from '@app/Schemas/history/history.schema';
import { Utils } from '@app/services/utils/utils.service';
import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Model } from 'mongoose';
import { GameHistory } from '@common/game-history';
/**
 * Controlleur de games. Les jeux crées sont permanents et la synchronisation entre la memoire serveur et la permanence est automatique
 */
@Controller('history')
export class HistoryController {
    constructor(@InjectModel('GameHistory') private history: Model<HistoryDocument>) {}

    @Post()
    async addToHistory(@Body() newHistoryEntry: GameHistory): Promise<GameHistory> {
        console.log('newHistoryEntry');
        if (!newHistoryEntry || !newHistoryEntry.gameId || !newHistoryEntry.playerOne || !newHistoryEntry.gameMode) {
            throw new HttpException('Données manquantes.', HttpStatus.BAD_REQUEST);
        }
        this.history.findOneAndUpdate(
            { gameId: newHistoryEntry.gameId, startDateTime: newHistoryEntry.startDateTime, playerOne: newHistoryEntry.playerOne },
            newHistoryEntry,
            {
                upsert: true,
            },
        );

        return this.history.create(newHistoryEntry);
    }

    @Get(':id')
    async getHistory(@Param('id') id: string): Promise<GameHistory[]> {
        if (!id) {
            throw new HttpException('Pas id maquant', HttpStatus.BAD_REQUEST);
        }
        return this.history.find({ gameId: id });
    }

    @Delete(':id')
    async deleteHistory(@Param('id') id: string) {
        if (!id) {
            throw new HttpException('Pas id maquant', HttpStatus.BAD_REQUEST);
        }
        this.history.deleteMany({ gameId: id });
    }
}
