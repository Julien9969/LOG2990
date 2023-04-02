/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, no-restricted-imports, max-lines, max-len  */
import { MatchmakingGateway } from '@app/gateway/match-making/match-making.gateway';
import { GameDocument } from '@app/Schemas/game/game.schema';
import { FinishedGame } from '@common/finishedGame';
import { Game } from '@common/game';
import { HttpException, HttpStatus } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import mongoose, { Model } from 'mongoose';
import { DIFFERENCE_LISTS_FOLDER, DIFFERENCE_LISTS_PREFIX } from '../constants/services.const';
import { DifferenceDetectionService } from '../difference-detection/difference-detection.service';
import { ImageService } from '../images/image.service';
import { GameService } from './game.service';
import { stubGame, stubInputGame } from './game.service.spec.const';

jest.mock('mongoose');

describe('Game Service tests', () => {
    let gameService: GameService;
    let gameModel: Model<GameDocument>;
    let imageService: ImageService;
    let matchMakingGateway: MatchmakingGateway;
    const stubUpdate = {
        exec: () => {},
    };
    const stubGameModel = {
        find: jest.fn(),
        findOne: jest.fn().mockReturnValue(stubGame),
        create: jest.fn().mockReturnValue(stubGame),
        deleteOne: jest.fn().mockReturnValue(stubGame),
        updateOne: jest.fn().mockReturnValue(stubUpdate),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameService,
                {
                    provide: getModelToken('Game'),
                    useValue: stubGameModel,
                },
                ImageService,
                {
                    provide: MatchmakingGateway,
                    useValue: {
                        notifyGameDeleted: jest.fn().mockImplementation(() => {}),
                    },
                },
            ],
        }).compile();

        gameService = module.get<GameService>(GameService);
        gameModel = module.get<Model<GameDocument>>(getModelToken('Game'));
        imageService = module.get<ImageService>(ImageService);
        matchMakingGateway = module.get<MatchmakingGateway>(MatchmakingGateway);
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
            jest.spyOn(DifferenceDetectionService.prototype as any, 'saveDifferenceLists').mockImplementation(() => {});
            jest.spyOn(gameService, 'verifyGameId' as any).mockImplementation(async () => {});
            jest.spyOn(imageService, 'saveImage').mockImplementation(() => 0);
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

            const result = await gameService.create(stubInputGame, Buffer.from([]), Buffer.from([]));
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
                await gameService.create(stubInputGame, Buffer.from([]), Buffer.from([]));
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
                await gameService.create({ name: 'gamename', radius: undefined }, Buffer.from([]), Buffer.from([]));
            } catch (err) {
                status = err.status;
                expect(err).toBeInstanceOf(HttpException);
            }
            expect(status).toEqual(HttpStatus.BAD_REQUEST);
        });
    });

    describe('delete', () => {
        beforeEach(() => {
            jest.spyOn(gameService, 'verifyGameId' as any).mockImplementation(async () => {});
        });
        it('should call delete from gameModels with correct game id', async () => {
            jest.spyOn(gameService, 'findById').mockImplementation(async () => Promise.resolve(stubGame));
            const imageDeleteSpy = jest.spyOn(imageService, 'deleteImage').mockImplementation(() => {});
            const unlinkSpy = jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

            await gameService.delete(stubGame.id);
            expect(imageDeleteSpy).toHaveBeenCalledTimes(2);
            expect(imageDeleteSpy).toHaveBeenNthCalledWith(1, stubGame.imageMain);
            expect(imageDeleteSpy).toHaveBeenNthCalledWith(2, stubGame.imageAlt);
            expect(unlinkSpy).toHaveBeenCalledTimes(1);
            expect(unlinkSpy).toHaveBeenCalledWith(`${DIFFERENCE_LISTS_FOLDER}/${DIFFERENCE_LISTS_PREFIX}${stubGame.id}.json`);
            expect(gameModel.deleteOne).toHaveBeenCalledWith({ _id: stubGame.id });
            expect(gameModel.deleteOne).toHaveBeenCalled();
        });

        it('should notify waiting rooms of deleted game', async () => {
            jest.spyOn(gameService, 'findById').mockImplementation(async () => Promise.resolve(stubGame));
            jest.spyOn(imageService, 'deleteImage').mockImplementation(() => {});
            jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
            const notifyMatchMakingSpy = jest.spyOn(matchMakingGateway, 'notifyGameDeleted').mockImplementation(() => {});

            await gameService.delete(stubGame.id);
            expect(notifyMatchMakingSpy).toHaveBeenCalledWith(stubGame.id);
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

        it('throws an internal server error when database fails', () => {
            jest.spyOn(gameService, 'findById').mockImplementation(async () => Promise.resolve(stubGame));
            jest.spyOn(imageService, 'deleteImage').mockImplementation(() => {});
            jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
            jest.spyOn(gameModel, 'deleteOne').mockImplementation(() => {
                throw new Error();
            });

            expect(gameService.delete('0')).rejects.toThrow();
        });
    });

    describe('findById', () => {
        beforeEach(() => {
            jest.spyOn(gameService, 'verifyGameId' as any).mockImplementation(async () => {});
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

        it('throws an internal server error when database fails', () => {
            jest.spyOn(gameModel, 'findOne').mockImplementation(() => {
                throw new Error();
            });

            expect(gameService.findById('0')).rejects.toThrow();
        });
    });

    describe('compareImages method', () => {
        beforeEach(() => {
            jest.spyOn(gameService, 'verifyGameId' as any).mockImplementation(async () => {});
        });
        it('Throws an error when a parameter is missing', () => {
            jest.spyOn(DifferenceDetectionService.prototype as any, 'compareImages').mockResolvedValue(undefined);
            jest.spyOn(DifferenceDetectionService.prototype as any, 'getComparisonResult').mockResolvedValue(undefined);

            const invalidGame = { name: 'test', radius: 0 };

            expect(async () => {
                await gameService.compareImages(invalidGame, Buffer.from([]), undefined, new DifferenceDetectionService());
            }).rejects.toThrow(new Error('Le jeu nécessite une image ou rayon.'));
        });

        it('Throws an error when image comparison fails', () => {
            jest.spyOn(DifferenceDetectionService.prototype as any, 'compareImages').mockRejectedValue(new Error());
            jest.spyOn(DifferenceDetectionService.prototype as any, 'getComparisonResult').mockReturnValue(undefined);

            expect(async () => {
                await gameService.compareImages(stubInputGame, Buffer.from([]), Buffer.from([]), new DifferenceDetectionService());
            }).rejects.toThrow(new Error());
        });

        it('returns result when image comparison succeeds', async () => {
            const mockResult = {
                isValid: false,
                isHard: false,
                differenceCount: 0,
                differenceImageId: 0,
            };

            jest.spyOn(DifferenceDetectionService.prototype as any, 'compareImages').mockResolvedValue(new Error());
            jest.spyOn(DifferenceDetectionService.prototype as any, 'getComparisonResult').mockReturnValue(mockResult);

            const result = await gameService.compareImages(stubInputGame, Buffer.from([]), Buffer.from([]), new DifferenceDetectionService());

            expect(result).toEqual(mockResult);
        });
    });

    describe('verifyId', () => {
        let isValidIdSpy: jest.SpyInstance;
        beforeEach(() => {
            isValidIdSpy = jest.spyOn(mongoose, 'isValidObjectId').mockReturnValue(true);
        });

        it('should call mongoose.isValidObjectId method', () => {
            gameService['verifyGameId']('0');
            expect(isValidIdSpy).toBeCalledTimes(1);
        });

        it('should not throw an error when id is valid', () => {
            expect(() => gameService['verifyGameId']('0')).not.toThrow();
        });

        it('should throw an error when id is not valid', () => {
            isValidIdSpy.mockReturnValue(false);
            expect(() => gameService['verifyGameId']('0')).toThrow();
        });
    });

    describe('scoreboard methods', () => {
        let testGame: Game;
        beforeEach(() => {
            testGame = {
                ...stubGame,
                scoreBoardSolo: [
                    ['Bowser', 150],
                    ['Peach', 250],
                    ['Mario', 780],
                ],
                scoreBoardMulti: [
                    ['BowserFamily', 150],
                    ['PeachFamily', 250],
                    ['MarioFamily', 780],
                ],
            };
        });

        it('getSoloScoreboard returns solo game scoreboard', async () => {
            jest.spyOn(gameService, 'findById').mockImplementation(async () => {
                return testGame;
            });
            const scoreBoard = await gameService.getSoloScoreboard('id');
            expect(scoreBoard).toEqual(testGame.scoreBoardSolo);
        });

        it('getSoloScoreboard returns null when no game', async () => {
            jest.spyOn(gameService, 'findById').mockImplementation(async () => {
                return undefined;
            });
            const scoreBoard = await gameService.getSoloScoreboard('id');
            expect(scoreBoard).toEqual(null);
        });

        it('getMultiScoreboard returns multi game scoreboard', async () => {
            jest.spyOn(gameService, 'findById').mockImplementation(async () => {
                return testGame;
            });
            const scoreBoard = await gameService.getMultiScoreboard('id');
            expect(scoreBoard).toEqual(testGame.scoreBoardMulti);
        });

        it('getMultiScoreboard returns null when no game', async () => {
            jest.spyOn(gameService, 'findById').mockImplementation(async () => {
                return undefined;
            });
            const scoreBoard = await gameService.getMultiScoreboard('id');
            expect(scoreBoard).toEqual(null);
        });

        describe('addToScoreboard', () => {
            let getSoloScoreSpy: jest.SpyInstance;
            let getMultiScoreSpy: jest.SpyInstance;
            let pushSoloSpy: jest.SpyInstance;
            let pushMultiSpy: jest.SpyInstance;

            const stubFinishedGameSolo: FinishedGame = {
                winner: 'winner',
                solo: true,
                time: 10,
            };
            const stubFinishedGameMulti: FinishedGame = {
                winner: 'winner-multi',
                solo: false,
                time: 10,
            };

            beforeEach(() => {
                getSoloScoreSpy = jest.spyOn(gameService, 'getSoloScoreboard').mockImplementation(async () => {
                    return testGame.scoreBoardSolo;
                });

                getMultiScoreSpy = jest.spyOn(gameService, 'getMultiScoreboard').mockImplementation(async () => {
                    return testGame.scoreBoardMulti;
                });

                pushSoloSpy = jest.spyOn(testGame.scoreBoardSolo, 'push');
                pushMultiSpy = jest.spyOn(testGame.scoreBoardMulti, 'push');
            });

            it('addToScoreboard does not update database if no scoreboard found', () => {
                getSoloScoreSpy.mockImplementationOnce(async () => {
                    return undefined;
                });
                const updateSpy = jest.spyOn(gameModel, 'updateOne');
                gameService.addToScoreboard('id', stubFinishedGameSolo);

                expect(updateSpy).not.toBeCalled();
            });

            it('addToScoreboard leaves score unchanged if unbeaten', () => {
                stubFinishedGameSolo.time = 900;
                gameService.addToScoreboard('id', stubFinishedGameSolo);

                expect(pushSoloSpy).not.toBeCalled();
                expect(pushMultiSpy).not.toBeCalled();
            });

            it('addToScoreboard inserts player to solo score when new solo high score', async () => {
                jest.spyOn(gameService, 'findById').mockImplementation(async () => {
                    return testGame;
                });
                stubFinishedGameSolo.time = 1;

                await gameService.addToScoreboard('id', stubFinishedGameSolo);

                expect(getSoloScoreSpy).toBeCalled();
                expect(getMultiScoreSpy).not.toBeCalled();
            });

            it('addToScoreboard inserts player to multi score when new multi high score', () => {
                jest.spyOn(gameService, 'findById').mockImplementation(async () => {
                    return testGame;
                });
                stubFinishedGameMulti.time = 1;
                gameService.addToScoreboard('id', stubFinishedGameMulti);

                expect(getSoloScoreSpy).not.toBeCalled();
                expect(getMultiScoreSpy).toBeCalled();
            });

            it('throws an internal server error when database fails', () => {
                jest.spyOn(gameModel, 'updateOne').mockImplementation(() => {
                    throw new Error();
                });

                expect(gameService.addToScoreboard('id', stubFinishedGameMulti)).rejects.toThrow();
            });
        });
    });

    describe('saveGameInDatabase', () => {
        it('throws an internal server error when database fails', () => {
            jest.spyOn(gameModel, 'create').mockImplementation(async () => {
                throw new Error();
            });

            expect(gameService['saveGameInDatabase'](undefined, undefined)).rejects.toThrow();
        });
    });
});
