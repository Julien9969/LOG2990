/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, no-restricted-imports, max-lines, max-len  */
import { GameDocument } from '@app/Schemas/game/game.schema';
import { InputGame } from '@common/input-game';
import { HttpException, HttpStatus } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import mongoose, { Model } from 'mongoose';
import { DifferenceDetectionService } from '../difference-detection/difference-detection.service';
import { GameService } from './game.service';
import { stubGame, stubInputGame } from './game.service.spec.const';

jest.mock('mongoose');

describe('Game Service tests', () => {
    let gameService: GameService;
    let gameModel: Model<GameDocument>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameService,
                {
                    provide: getModelToken('Game'),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn().mockReturnValue(stubGame),
                        create: jest.fn().mockReturnValue(stubGame),
                        deleteOne: jest.fn().mockReturnValue(stubGame),
                    },
                },
            ],
        }).compile();

        gameService = module.get<GameService>(GameService);
        gameModel = module.get<Model<GameDocument>>(getModelToken('Game'));
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('service should be defined', async () => {
        expect(gameService).toBeDefined();
    });

    it('findAll should ask gameModel to find all the games', () => {
        gameService.findAll();
        expect(gameModel.find).toBeCalledTimes(1);
    });

    describe('create', () => {
        beforeEach(() => {
            jest.spyOn(DifferenceDetectionService.prototype as any, 'saveDifferences').mockImplementation(() => {});
            jest.spyOn(gameService, 'verifyGameId').mockImplementation(async () => {});
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
            jest.spyOn(gameService, 'verifyGameId').mockImplementation(async () => {});
        });
        it('should call delete from gameModels with correct game id', async () => {
            jest.spyOn(gameService, 'findById').mockImplementation(async () => Promise.resolve(stubGame));

            await gameService.delete(stubGame.id);
            expect(gameModel.deleteOne).toHaveBeenCalledWith({ _id: stubGame.id });
            expect(gameModel.deleteOne).toHaveBeenCalled();
        });

        it('throws NOT FOUND when game doesnt exist', async () => {
            jest.spyOn(gameModel, 'findOne').mockReturnValueOnce(undefined);
            jest.spyOn(gameModel, 'deleteOne').mockImplementation(() => undefined);
            jest.spyOn(gameService, 'findById').mockImplementation(() => undefined);

            let status: number;
            try {
                await gameService.delete('0');
            } catch (err) {
                status = err.status;
                expect(err).toBeInstanceOf(HttpException);
            }
            expect(status).toEqual(HttpStatus.NOT_FOUND);
        });
    });

    describe('findById', () => {
        beforeEach(() => {
            jest.spyOn(gameService, 'verifyGameId').mockImplementation(async () => {});
        });
        it('should call gameModels findOne method with correct id', async () => {
            await gameService.findById(stubGame.id);
            expect(gameModel.findOne).toHaveBeenCalledWith({ _id: stubGame.id });
        });

        it('returns null when game not found', async () => {
            jest.spyOn(gameModel, 'findOne').mockReturnValueOnce(undefined);
            const game = await gameService.findById('0');
            expect(game).toBeFalsy();
        });
    });

    describe('compareImages method', () => {
        beforeEach(() => {
            jest.spyOn(gameService, 'verifyGameId').mockImplementation(async () => {});
        });
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

    describe('verifyId', () => {
        let isValidIdSpy: jest.SpyInstance;
        beforeEach(() => {
            isValidIdSpy = jest.spyOn(mongoose, 'isValidObjectId').mockReturnValue(true);
        });

        it('should call mongoose.isValidObjectId method', () => {
            gameService.verifyGameId('0');
            expect(isValidIdSpy).toBeCalledTimes(1);
        });

        it('should not throw an error when id is valid', () => {
            expect(() => gameService.verifyGameId('0')).not.toThrow();
        });

        it('should throw an error when id is not valid', () => {
            isValidIdSpy.mockReturnValue(false);
            expect(() => gameService.verifyGameId('0')).toThrow();
        });
    });
});
