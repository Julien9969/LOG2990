import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HistoryController } from './history.controller';
import { GameHistory } from '@common/game-history';
import { getModelToken } from '@nestjs/mongoose';

describe('HistoryController', () => {
    let controller: HistoryController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HistoryController],
            providers: [
                {
                    provide: getModelToken('GameHistory'),
                    useValue: {
                        find: jest.fn(),
                        findOneAndUpdate: jest.fn(),
                        deleteMany: jest.fn(),
                    },
                },
            ],
        }).compile();
        controller = module.get<HistoryController>(HistoryController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('post should throw an error if the body is empty', async () => {
        await expect(controller.addToHistory(null)).rejects.toThrowError(HttpException);
    });

    it('post should throw an error if the body is missing a gameId', async () => {
        await expect(controller.addToHistory({} as GameHistory)).rejects.toThrowError(HttpException);
    });

    it('post should call findOneAndUpdate if body is valid', async () => {
        const gameHistory = { gameId: '1', startDateTime: '1', gameMode: '1', playerOne: '1' } as GameHistory;
        await controller.addToHistory(gameHistory);
        expect(controller['history'].findOneAndUpdate).toHaveBeenCalled();
    });

    it('get should throw an error if the id is missing', async () => {
        await expect(controller.getHistory(null)).rejects.toThrowError(HttpException);
    });

    it('get should call find if id is valid', async () => {
        await controller.getHistory('1');
        expect(controller['history'].find).toHaveBeenCalled();
    });

    it('delete should throw an error if the id is missing', async () => {
        await expect(controller.deleteHistory(null)).rejects.toThrowError(HttpException);
    });

    it('delete should call deleteMany if id is valid', async () => {
        await controller.deleteHistory('1');
        expect(controller['history'].deleteMany).toHaveBeenCalled();
    });
});
