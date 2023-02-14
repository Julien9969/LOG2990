/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, max-lines  */
import { GameService } from '@app/services/game/game.service';
import { stubGame, stubInputGame } from '@app/services/game/game.service.spec.const';
import { Game } from '@common/game';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import { GamesController } from './games.controller';
import { exampleGame } from './games.controller.spec.const';

describe('GameController tests', () => {
    let controller: GamesController;
    let gameService: SinonStubbedInstance<GameService>;

    beforeEach(async () => {
        gameService = createStubInstance(GameService);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [GamesController],
            providers: [
                {
                    provide: GameService,
                    useValue: gameService,
                },
            ],
        }).compile();
        controller = module.get<GamesController>(GamesController);

        jest.spyOn(controller['gameService'], 'saveState').mockImplementation(() => {});
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findall should retrun a list of games', () => {
        jest.spyOn(controller['gameService'], 'findAll').mockImplementation(() => {
            return [];
        });
        const games = controller.getAllGames();
        expect(games).toEqual([]);
    });

    it('deletebyId should call delete() with the correct id', () => {
        const deleteSpy = jest.spyOn(controller['gameService'], 'delete').mockImplementation(() => '');
        controller.deleteById('5');

        expect(deleteSpy).toBeCalledWith(5);
    });

    it('creating a valid game returns created game', async () => {
        jest.spyOn(controller['gameService'], 'create').mockImplementation(async () => {
            return new Promise<Game>((resolve) => {
                resolve(stubGame);
            });
        });

        const result = await controller.newGame(stubInputGame);
        expect(result).toEqual(stubGame);
    });

    it('trying to create an invalid game should return an error', () => {
        const testGame = undefined;

        jest.spyOn(controller['gameService'], 'create').mockImplementation(async () => {
            return new Promise<Game>((resolve) => {
                resolve(testGame);
            });
        });

        expect(async () => {
            await controller.newGame(testGame);
        }).rejects.toThrowError(HttpException);
    });

    it('get should return an error if the id is invalid', () => {
        jest.spyOn(controller['gameService'], 'findById').mockImplementation(() => {
            return undefined;
        });
        expect(() => {
            controller.getGame('-1');
        }).toThrowError(new HttpException('Jeu -1 non existant.', HttpStatus.NOT_FOUND));
    });

    it('get should call findById()', () => {
        const getGameByIdSpy = jest.spyOn(controller['gameService'], 'findById').mockImplementation(() => {
            return exampleGame;
        });
        const message = controller.getGame('12');
        expect(getGameByIdSpy).toHaveBeenCalledWith(12);
        expect(message).toEqual(exampleGame);
    });

    it('deleteById should call the coresponding service function', () => {
        const spy = jest.spyOn(controller['gameService'], 'delete').mockImplementation(() => {});
        controller.deleteById('12');
        expect(spy).toHaveBeenCalledWith(12);
    });
    it('GetAllGames should call the coresponding service function', () => {
        const spy = jest.spyOn(controller['gameService'], 'findAll').mockImplementation(() => {
            return [exampleGame];
        });
        controller.getAllGames();
        expect(spy).toHaveBeenCalled();
    });

    it('newGame should return an error if called without a game', () => {
        jest.spyOn(controller['gameService'], 'create').mockImplementation(async () => {
            return new Promise<Game>((resolve) => {
                resolve(exampleGame);
            });
        });
        expect(async () => {
            await controller.newGame(null);
        }).rejects.toThrowError(new HttpException('Nom du jeu absent.', HttpStatus.BAD_REQUEST));
    });

    it('newGame should return an error if the game isnt valid', () => {
        jest.spyOn(controller['gameService'], 'create').mockImplementation(async () => {
            return new Promise<Game>((resolve, reject) => {
                reject(new Error(''));
            });
        });
        const invalidGame = exampleGame;
        invalidGame.isValid = false;
        expect(async () => {
            await controller.newGame(stubInputGame);
        }).rejects.toThrowError(new HttpException('', HttpStatus.BAD_REQUEST));
    });
});
