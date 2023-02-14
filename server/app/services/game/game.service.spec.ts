/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, no-restricted-imports, max-lines, max-len  */
import { GAME_DATA_FILE_PATH } from '@app/services/constants/services.const';
import { InputGame } from '@common/input-game';
import { HttpException } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common/enums';
import * as fs from 'fs';
import { DifferenceDetectionService } from '../difference-detection/difference-detection.service';
import { GameService } from './game.service';
import { gameListStub, gameListStubWithout3, gameListStubWithout3Nor0, stubGame, stubInputGame } from './game.service.spec.const';

let gameService: GameService;

describe('Game Service tests', () => {
    beforeAll(async () => {
        jest.spyOn(GameService.prototype, 'populate').mockImplementation(() => {});
        gameService = new GameService();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('service should be defined', async () => {
        expect(gameService).toBeDefined();
    });

    it('constructor should populate from gamesData', () => {
        const populateSpy = jest.spyOn(GameService.prototype as any, 'populate').mockImplementation(() => {});
        new GameService();

        expect(populateSpy).toBeCalled();
    });

    it('findAll should return list of all games', () => {
        gameService['allGames'] = gameListStub;
        expect(gameService.findAll()).toEqual(gameListStub);
    });

    describe('create method', () => {
        let addToListSpy: jest.SpyInstance;
        let saveStateSpy: jest.SpyInstance;
        let saveDiffSpy: jest.SpyInstance;
        beforeEach(() => {
            addToListSpy = jest.spyOn(gameService, 'addToList').mockImplementation((game) => {
                return (game.id = 0);
            });
            saveDiffSpy = jest.spyOn(DifferenceDetectionService.prototype as any, 'saveDifferences').mockImplementation(() => {});
            saveStateSpy = jest.spyOn(gameService, 'saveState').mockImplementation(() => {});
        });

        it('create returns valid game when valid input', async () => {
            jest.spyOn(gameService, 'compareImages').mockImplementation(async () => {
                return new Promise((resolve) => {
                    resolve({
                        isValid: true,
                        isHard: stubGame.isHard,
                        differenceCount: stubGame.differenceCount,
                    });
                });
            });

            const result = await gameService.create(stubInputGame);
            expect(result).toBeDefined();
            expect(result.isValid).toEqual(true);
        });

        it('create adds game to list and saves state when valid', async () => {
            jest.spyOn(gameService, 'compareImages').mockImplementation(async () => {
                return new Promise((resolve) => {
                    resolve({
                        isValid: true,
                        isHard: stubGame.isHard,
                        differenceCount: stubGame.differenceCount,
                    });
                });
            });
            await gameService.create(stubInputGame);

            expect(addToListSpy).toBeCalledTimes(1);
            expect(saveDiffSpy).toBeCalledTimes(1);
            expect(saveStateSpy).toBeCalledTimes(1);
        });

        it('create throws BAD REQUEST when images are invalid', async () => {
            jest.spyOn(gameService, 'compareImages').mockImplementation(async () => {
                return new Promise((resolve) => {
                    resolve({
                        isValid: false,
                        isHard: undefined,
                        differenceCount: undefined,
                    });
                });
            });
            let status: number;
            try {
                await gameService.create(stubInputGame);
            } catch (err) {
                status = err.status;
                expect(err).toBeInstanceOf(HttpException);
            }
            expect(status).toEqual(HttpStatus.BAD_REQUEST);
        });

        it('create throws BAD REQUEST when a missing parameter', async () => {
            jest.spyOn(gameService, 'compareImages').mockImplementation(() => {
                throw new Error();
            });
            let status: number;
            try {
                await gameService.create({
                    name: 'gamename',
                    imageMain: 0,
                    imageAlt: 0,
                    radius: undefined,
                });
            } catch (err) {
                status = err.status;
                expect(err).toBeInstanceOf(HttpException);
            }
            expect(status).toEqual(HttpStatus.BAD_REQUEST);
        });
    });

    describe('delete', () => {
        beforeEach(() => {
            jest.spyOn(gameService, 'saveState').mockImplementation(() => {});
        });

        it('removes game from allGames', () => {
            gameService['allGames'] = [...gameListStub];
            jest.spyOn(gameService, 'findById').mockImplementation(() => {
                return gameListStub[0];
            });
            gameService.delete(3);

            jest.spyOn(gameService, 'findById').mockImplementation(() => {
                return gameListStub[3];
            });
            expect(gameService['allGames']).toEqual(gameListStubWithout3);
            gameService.delete(0);
            expect(gameService['allGames']).toEqual(gameListStubWithout3Nor0);
        });

        it('throws NOT FOUND when game doesnt exist', () => {
            jest.spyOn(gameService, 'findById').mockImplementation(() => undefined);

            let status: number;
            try {
                gameService.delete(0);
            } catch (err) {
                status = err.status;
                expect(err).toBeInstanceOf(HttpException);
            }
            expect(status).toEqual(HttpStatus.NOT_FOUND);
        });
    });

    it('addToList does not override existing game ids', () => {
        gameService['allGames'] = [...gameListStub];

        const findSpy = jest
            .spyOn(gameService, 'findById')
            .mockImplementationOnce(() => stubGame)
            .mockImplementationOnce(() => stubGame)
            .mockImplementationOnce(() => null);

        const randomSpy = jest.spyOn(Math, 'random').mockImplementation(() => 0);

        gameService.addToList({ ...stubGame });

        expect(findSpy).toBeCalledTimes(3);
        expect(randomSpy).toBeCalledTimes(3);

        expect(gameService['allGames'].length).toEqual(gameListStub.length + 1);
        expect(gameService['allGames']).toEqual([...gameListStub, stubGame]);
    });

    describe('findById method', () => {
        it('returns game of correct id', () => {
            gameService['allGames'] = [...gameListStub];
            const game0 = gameService.findById(gameListStub[0].id);
            const game1 = gameService.findById(gameListStub[1].id);

            expect(game0).toEqual(gameListStub[0]);
            expect(game1).toEqual(gameListStub[1]);
        });

        it('returns null when game not found', () => {
            gameService['allGames'] = [...gameListStub];
            const game = gameService.findById(999);

            expect(game).toBeFalsy();
        });
    });

    it('saveState writes game data in correct file', () => {
        gameService['allGames'] = gameListStub;
        const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
        gameService.saveState();
        const expectedData = JSON.stringify(gameListStub);
        expect(writeSpy).toBeCalledWith(GAME_DATA_FILE_PATH, expectedData);
    });

    describe('populate method', () => {
        it('reads game data in correct file', () => {
            gameService['allGames'] = [];
            const fileData = JSON.stringify(gameListStub);
            const readSpy = jest.spyOn(fs, 'readFileSync').mockImplementation(() => fileData);
            gameService.populate();
            expect(readSpy).toBeCalledWith(GAME_DATA_FILE_PATH);
            expect(gameService['allGames']).toEqual(gameListStub);
        });

        it('throws an error when file cant be read', () => {
            jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
                throw new Error();
            });
            expect(() => {
                gameService.populate();
            }).toThrow(Error);
        });
    });

    describe('compareImages method', () => {
        it('Throws an error when a parameter is missing', () => {
            jest.spyOn(DifferenceDetectionService.prototype as any, 'compareImagePaths').mockResolvedValue(undefined);
            jest.spyOn(DifferenceDetectionService.prototype as any, 'getComparisonResult').mockResolvedValue(undefined);

            const invalidGame: InputGame = {
                name: 'test',
                imageMain: 0,
                imageAlt: undefined,
                radius: 0,
            };

            expect(async () => {
                await gameService.compareImages(invalidGame, new DifferenceDetectionService());
            }).rejects.toThrow(new Error('Le jeu nécessite une image ou rayon.'));
        });

        it('Throws an error when image comparison fails', () => {
            jest.spyOn(DifferenceDetectionService.prototype as any, 'compareImagePaths').mockRejectedValue(new Error());
            jest.spyOn(DifferenceDetectionService.prototype as any, 'getComparisonResult').mockReturnValue(undefined);

            expect(async () => {
                await gameService.compareImages(stubInputGame, new DifferenceDetectionService());
            }).rejects.toThrow(new Error());
        });

        it('returns result when image comparison succeeds', async () => {
            const mockResult = {
                isValid: false,
                isHard: false,
                differenceCount: 0,
                differenceImageId: 0,
            };

            jest.spyOn(DifferenceDetectionService.prototype as any, 'compareImagePaths').mockResolvedValue(new Error());
            jest.spyOn(DifferenceDetectionService.prototype as any, 'getComparisonResult').mockReturnValue(mockResult);

            const result = await gameService.compareImages(stubInputGame, new DifferenceDetectionService());

            expect(result).toEqual(mockResult);
        });
    });
});
