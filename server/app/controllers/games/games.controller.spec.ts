/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, max-lines  */
import { GameConstantsInput } from '@app/interfaces/game-constants-input';
import { GameService } from '@app/services/game/game.service';
import { stubGame, stubGameCreationBody, stubGameFileInput } from '@app/services/game/game.service.spec.const';
import { Game } from '@common/game';
import { GameConstants } from '@common/game-constants';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { GamesController } from './games.controller';
import { exampleGame } from './games.controller.spec.const';

describe('GameController tests', () => {
    let controller: GamesController;
    let gameService: SinonStubbedInstance<GameService>;
    let logger: Logger;

    beforeEach(async () => {
        gameService = createStubInstance(GameService);
        logger = createStubInstance(Logger);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [GamesController],
            providers: [
                {
                    provide: GameService,
                    useValue: gameService,
                },
                {
                    provide: Logger,
                    useValue: logger,
                },
            ],
        }).compile();
        controller = module.get<GamesController>(GamesController);

        jest.spyOn(controller['logger'], 'error').mockImplementation(() => {});
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findall should retrun a list of games', async () => {
        jest.spyOn(controller['gameService'], 'findAll').mockReturnValue(Promise.resolve([exampleGame]));
        const games = await controller.getAllGames();
        expect(games).toEqual([exampleGame]);
    });

    describe('deleteById', () => {
        it('should call the coresponding service function', async () => {
            const spy = jest.spyOn(controller['gameService'], 'delete').mockImplementation(async () => {});
            await controller.deleteById('12');
            expect(spy).toHaveBeenCalledWith('12');
        });

        it('should call delete() with the correct id', async () => {
            const deleteSpy = jest.spyOn(controller['gameService'], 'delete').mockImplementation(async () => {});
            await controller.deleteById('5');

            expect(deleteSpy).toBeCalledWith('5');
        });

        it('should log an error when delete fails', async () => {
            jest.spyOn(controller['gameService'], 'delete').mockImplementation(async () => {
                throw new Error();
            });
            const logErrorSpy = jest.spyOn(logger, 'error').mockImplementation();
            await controller.deleteById('5');

            expect(logErrorSpy).toBeCalled();
        });
    });

    it('get should return an error if the id is invalid', async () => {
        jest.spyOn(controller['gameService'], 'findById').mockReturnValue(undefined);
        expect(async () => {
            await controller.getGame('-1');
        }).rejects.toThrowError(HttpException);
    });

    it('get should call findById()', async () => {
        const getGameByIdSpy = jest.spyOn(controller['gameService'], 'findById').mockReturnValue(Promise.resolve(exampleGame));
        const message = await controller.getGame('12');
        expect(getGameByIdSpy).toHaveBeenCalledWith('12');
        expect(message).toEqual(exampleGame);
    });

    it('GetAllGames should call the coresponding service function', async () => {
        const spy = jest.spyOn(controller['gameService'], 'findAll').mockImplementation(async () => {
            return [exampleGame];
        });
        await controller.getAllGames();
        expect(spy).toHaveBeenCalled();
    });

    describe('newGame', () => {
        it('creating a valid game returns created game', async () => {
            jest.spyOn(controller['gameService'], 'create').mockReturnValue(Promise.resolve(stubGame));

            const result = await controller.newGame(stubGameCreationBody, stubGameFileInput);
            expect(result).toEqual(stubGame);
        });

        it('trying to create an invalid game should return an error', () => {
            let testGame: undefined;

            jest.spyOn(controller['gameService'], 'create').mockReturnValue(Promise.resolve(testGame));

            expect(async () => {
                await controller.newGame({ name: '', radius: undefined }, stubGameFileInput);
            }).rejects.toThrowError(HttpException);
        });

        it('should return an error if called without a game', () => {
            jest.spyOn(controller['gameService'], 'create').mockImplementation(async () => {
                return new Promise<Game>((resolve) => {
                    resolve(exampleGame);
                });
            });
            expect(async () => {
                await controller.newGame(null, null);
            }).rejects.toThrowError(new HttpException('Nom du jeu absent.', HttpStatus.BAD_REQUEST));
        });

        it('should return an error if called without files', () => {
            jest.spyOn(controller['gameService'], 'create').mockImplementation(async () => {
                return new Promise<Game>((resolve) => {
                    resolve(exampleGame);
                });
            });
            expect(async () => {
                await controller.newGame(stubGameCreationBody, null);
            }).rejects.toThrowError(new HttpException('Le jeu nécessite 2 images et un rayon.', HttpStatus.BAD_REQUEST));
        });

        it('should return an error if the game isnt valid', () => {
            jest.spyOn(controller['gameService'], 'create').mockImplementation(async () => {
                return new Promise<Game>((resolve, reject) => {
                    reject(new Error(''));
                });
            });
            const invalidGame = exampleGame;
            invalidGame.isValid = false;
            expect(async () => {
                await controller.newGame(stubGameCreationBody, stubGameFileInput);
            }).rejects.toThrowError(new HttpException('', HttpStatus.BAD_REQUEST));
        });
    });

    it('getGameConstants should call game service getGameConstants', () => {
        const stubGameConstants: GameConstants = {};
        const gameConstsSpy = jest.spyOn(gameService, 'getGameConstants').mockImplementation(() => {
            return stubGameConstants;
        });

        const result = controller.getGameConstants();
        expect(result).toBe(stubGameConstants);
        expect(gameConstsSpy).toBeCalled();
    });

    describe('configureConstants', () => {
        let updateConstantsSpy: jest.SpyInstance;
        const stubGameConstsInput: GameConstantsInput = {};

        beforeEach(() => {
            updateConstantsSpy = jest.spyOn(gameService, 'updateConstants').mockImplementation(() => {});
        });

        it('calls gameService updateConstants', async () => {
            await controller.configureConstants(stubGameConstsInput);

            expect(updateConstantsSpy).toBeCalledWith(stubGameConstsInput);
        });

        it('throws an http BAD_REQUEST when input is undefined', async () => {
            let error: HttpException;
            try {
                await controller.configureConstants(undefined);
            } catch (err) {
                error = err;
            }
            expect(controller.configureConstants).rejects.toThrow();
            expect(error).toEqual(new HttpException('Il manque un corps dans la requete', HttpStatus.BAD_REQUEST));
        });

        it('throws an http BAD_REQUEST when gameService validation fails', async () => {
            updateConstantsSpy.mockImplementationOnce(() => {
                throw new Error('');
            });
            let error: HttpException;
            try {
                await controller.configureConstants(stubGameConstsInput);
            } catch (err) {
                error = err;
            }
            expect(controller.configureConstants).rejects.toThrow();
            expect(error).toEqual(new HttpException('', HttpStatus.BAD_REQUEST));
        });
    });

    it('deleteAllGames calls gameService deleteAllGames', () => {
        const deleteAllGamesSpy = jest.spyOn(gameService, 'deleteAllGames').mockImplementation();
        controller.deleteAllGames();

        expect(deleteAllGamesSpy).toBeCalled();
    });

    it('resetAllLeaderboards calls gameService resetAllLeaderboards', () => {
        const resetAllLeaderboardsSpy = jest.spyOn(gameService, 'resetAllLeaderboards').mockImplementation();
        controller.resetAllLeaderboards();

        expect(resetAllLeaderboardsSpy).toBeCalled();
    });

    describe('resetLeaderboard', () => {
        it('should call the coresponding service function', async () => {
            const spy = jest.spyOn(controller['gameService'], 'resetLeaderboard').mockImplementation(async () => {});
            await controller.resetLeaderboard('12');
            expect(spy).toHaveBeenCalledWith('12');
        });

        it('should call resetLeaderboard() with the correct id', async () => {
            const resetLeaderboardSpy = jest.spyOn(controller['gameService'], 'resetLeaderboard').mockImplementation(async () => {});
            await controller.resetLeaderboard('5');

            expect(resetLeaderboardSpy).toBeCalledWith('5');
        });

        it('should log an error when resetLeaderboard fails', async () => {
            jest.spyOn(controller['gameService'], 'resetLeaderboard').mockImplementation(async () => {
                throw new Error();
            });
            const logErrorSpy = jest.spyOn(logger, 'error').mockImplementation();
            await controller.resetLeaderboard('5');

            expect(logErrorSpy).toBeCalled();
        });
    });
});
