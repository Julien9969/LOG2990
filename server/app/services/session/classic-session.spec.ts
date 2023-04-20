/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import { GameConstants } from '@common/game-constants';
// import { Test, TestingModule } from '@nestjs/testing';
import { DifferenceValidationService } from '@app/services/difference-validation/difference-validation.service';
import { GameService } from '@app/services/game/game.service';
import { Coordinate } from '@common/coordinate';
import { GuessResult } from '@common/guess-result';
import mongoose from 'mongoose';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { ClassicSession } from './classic-session';
// import { Session } from './session';

// export class GameServiceStub {
//     // eslint-disable-next-line @typescript-eslint/no-magic-numbers
//     yay = 123;
//     getGameConstants(): GameConstants {
//         return {
//             time: 100,
//             penalty: 5,
//             reward: 10,
//         };
//     }
// }
jest.mock('mongoose');

describe('Session tests', () => {
    let soloClassicSession: ClassicSession;
    let multiClassicSession: ClassicSession;
    let differenceValidationService: SinonStubbedInstance<DifferenceValidationService>;
    // let session: SinonStubbedInstance<Session>;
    let gameServiceStub: GameService;

    beforeEach(async () => {
        differenceValidationService = createStubInstance<DifferenceValidationService>(DifferenceValidationService);
        differenceValidationService.differenceCoordLists = [[{ x: 0, y: 0 }]];

        gameServiceStub = jest.createMockFromModule<GameService>('@app/services/game/game.service');
        gameServiceStub.getGameConstants = jest.fn().mockReturnValue({
            time: 100,
            penalty: 5,
            reward: 10,
        });

        jest.spyOn(mongoose, 'isValidObjectId').mockReturnValue(true);

        jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
            // eslint-disable-next-line no-invalid-this
            DifferenceValidationService.prototype.differenceCoordLists = [[]];
        });
        const gameID = 'gameId';
        const soloPlayer = [
            {
                name: 'name',
                socketId: 'firstSocketId',
                differencesFound: [23],
            },
        ];
        soloClassicSession = new ClassicSession(gameServiceStub as GameService, gameID, soloPlayer);
        soloClassicSession.differenceValidationService = differenceValidationService;
        const multiPlayers = [
            {
                name: 'name',
                socketId: 'firstSocketId',
                differencesFound: [23],
            },
            {
                name: 'name',
                socketId: 'secondSocketId',
                differencesFound: [23],
            },
        ];
        multiClassicSession = new ClassicSession(gameServiceStub as GameService, gameID, multiPlayers);
        multiClassicSession.differenceValidationService = differenceValidationService;
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    describe('tryGuess', () => {
        const gameId = 'gameId';
        const firstSocketId = 'firstSocketId';
        const secondSocketId = 'secondSocketId';

        // const sessionSolo = new ClassicSession(gameServiceStub as any, gameId, [{ name: 'name', socketId: firstSocketId, differencesFound: [23] }]);
        // const sessionMulti = new ClassicSession(gameServiceStub as any, gameId, [
        //     { name: 'name', socketId: firstSocketId, differencesFound: [] },
        //     { name: 'name', socketId: secondSocketId, differencesFound: [] },
        // ]);

        it('SoloPlayer Game: tryguess should throw error if validateGuess returns false', () => {
            jest.spyOn(soloClassicSession.differenceValidationService, 'validateGuess').mockImplementation(() => {
                return false;
            });

            jest.spyOn(mongoose, 'isValidObjectId').mockReturnValue(true);

            let error: Error;

            try {
                soloClassicSession.tryGuess({ x: 12, y: 13 }, firstSocketId);
            } catch (e) {
                error = e;
            }
            expect(error).toEqual(new Error('Mauvais format de guess.'));
        });

        it('tryguess should return a guessResult with correct as true if it is not in the list of differences found', () => {
            jest.spyOn(soloClassicSession.differenceValidationService, 'validateGuess').mockImplementation(() => {
                return true;
            });
            jest.spyOn(soloClassicSession.differenceValidationService, 'checkDifference').mockImplementation(() => {
                return 5;
            });
            jest.spyOn(soloClassicSession.differenceValidationService, 'getDifferencePixelList').mockImplementation(() => {
                return [{ x: 11, y: 10 }];
            });
            jest.spyOn(soloClassicSession, 'buildGuessResult').mockReturnValue({
                isCorrect: true,
                differencesByPlayer: [],
                differencePixelList: [],
                winnerName: '',
            });
            soloClassicSession.players[0].differencesFound = [];
            soloClassicSession.tryGuess({ x: 11, y: 10 }, firstSocketId);
            // expect(sessionSolo.isDiffAlreadyFound).toEqual(false);
            expect(soloClassicSession.buildGuessResult).toHaveBeenCalledWith(true, [{ x: 11, y: 10 }]);
            // expect(result.guessResult).toEqual({ guessResult: { isCorrect: true, differencesByPlayer: [], differencePixelList: [] } });
            // expect(result.gameWonBy).toBeUndefined();
        });

        it('SoloPlayer Game: tryguess detects when difference already found  and the guess is incorrect', () => {
            jest.spyOn(soloClassicSession.differenceValidationService, 'validateGuess').mockImplementation(() => {
                return true;
            });
            jest.spyOn(soloClassicSession.differenceValidationService, 'loadDifferences').mockImplementation(() => {
                return null;
            });
            jest.spyOn(soloClassicSession.differenceValidationService, 'checkDifference').mockImplementation(() => {
                return 5;
            });
            jest.spyOn(soloClassicSession.differenceValidationService, 'getDifferencePixelList').mockReturnValue([
                { x: 11, y: 10 },
                { x: 1, y: 1 },
            ]);
            jest.spyOn(soloClassicSession, 'verifyGameWon').mockReturnValue('');

            soloClassicSession.players[0].differencesFound = [5];

            const result = soloClassicSession.tryGuess({ x: 11, y: 10 }, firstSocketId);
            expect(result).toEqual({ isCorrect: false, differencesByPlayer: [[firstSocketId, 1]], differencePixelList: [{ x: 11, y: 10 }], winnerName: '' });
        });

        it('SoloPlayer Game: tryguess returns incorrect result when no difference, and returns pressed coordinate', () => {
            jest.spyOn(soloClassicSession.differenceValidationService, 'validateGuess').mockImplementation(() => {
                return true;
            });
            jest.spyOn(soloClassicSession.differenceValidationService, 'loadDifferences').mockImplementation(() => {
                return null;
            });
            jest.spyOn(soloClassicSession.differenceValidationService, 'checkDifference').mockImplementation(() => {
                return undefined;
            });
            jest.spyOn(soloClassicSession.differenceValidationService, 'getDifferencePixelList').mockImplementation(() => {
                return [{ x: 11, y: 10 }];
            });
            jest.spyOn(soloClassicSession, 'verifyGameWon').mockReturnValue('');

            soloClassicSession.players[0].differencesFound = [5];

            const result = soloClassicSession.tryGuess({ x: 11, y: 10 }, firstSocketId);
            expect(result).toEqual({ isCorrect: false, differencesByPlayer: [[firstSocketId, 1]], differencePixelList: [{ x: 11, y: 10 }], winnerName: '' });
        });

        it('SoloPlayer Game: tryguess should throw error if validateGuess returns false', () => {
            jest.spyOn(soloClassicSession.differenceValidationService, 'validateGuess').mockImplementation(() => {
                return false;
            });
            let error: Error;

            try {
                soloClassicSession.tryGuess({ x: 12, y: 13 }, firstSocketId);
            } catch (e) {
                error = e;
            }
            expect(error).toEqual(new Error('Mauvais format de guess.'));
        });

        it('SoloPlayer Game: tryguess should catch and throw error if error in the the first try', () => {
            jest.spyOn(soloClassicSession.differenceValidationService, 'checkDifference').mockImplementation(() => {
                throw new Error('Error test');
            });
            let error: Error;

            try {
                soloClassicSession.tryGuess({ x: 12, y: 13 }, firstSocketId);
            } catch (e) {
                error = e;
            }
            expect(error).toEqual(new Error('Mauvais format de guess.'));
        });

        it('SoloPlayer Game: tryguess should call the right functions for this turn of events', () => {
            jest.spyOn(soloClassicSession.differenceValidationService, 'validateGuess').mockImplementation(() => {
                return true;
            });
            jest.spyOn(soloClassicSession.differenceValidationService, 'loadDifferences').mockImplementation(() => {
                return null;
            });
            jest.spyOn(soloClassicSession.differenceValidationService, 'checkDifference').mockImplementation(() => {
                return 3;
            });
            const getDiffPixListSpy = jest.spyOn(soloClassicSession.differenceValidationService, 'getDifferencePixelList').mockImplementation(() => {
                return [{ x: 11, y: 10 }];
            });

            jest.spyOn(soloClassicSession, 'verifyGameWon').mockReturnValue('');

            soloClassicSession.players[0].differencesFound = [5];

            const result = soloClassicSession.tryGuess({ x: 11, y: 10 }, firstSocketId);
            expect(getDiffPixListSpy).toHaveBeenCalled();
            expect(result).toEqual({
                isCorrect: true,
                differencesByPlayer: [[firstSocketId, 2]],
                differencePixelList: [{ x: 11, y: 10 }],
                winnerName: '',
            });
        });

        it('MultiPlayerGame: tryguess should return a guessResult with correct as true if it is not in the list of differences found', () => {
            jest.spyOn(multiClassicSession.differenceValidationService, 'validateGuess').mockImplementation(() => {
                return true;
            });
            jest.spyOn(multiClassicSession.differenceValidationService, 'checkDifference').mockImplementation(() => {
                return 5;
            });
            jest.spyOn(multiClassicSession.differenceValidationService, 'getDifferencePixelList').mockImplementation(() => {
                return [{ x: 11, y: 10 }];
            });
            jest.spyOn(multiClassicSession, 'verifyGameWon').mockReturnValue('');
            multiClassicSession.players[0].differencesFound = [];
            const result = multiClassicSession.tryGuess({ x: 11, y: 10 }, firstSocketId);
            expect(result).toEqual({
                isCorrect: true,
                differencesByPlayer: [
                    [firstSocketId, 1],
                    [secondSocketId, 1],
                ],
                differencePixelList: [{ x: 11, y: 10 }],
                winnerName: '',
            });
        });

        // it('tryguess detects when difference already found', () => {
        //     jest.spyOn(multiClassicSession.differenceValidationService, 'validateGuess').mockImplementation(() => {
        //         return true;
        //     });
        //     jest.spyOn(multiClassicSession.differenceValidationService, 'loadDifferences').mockImplementation(() => {
        //         return null;
        //     });
        //     jest.spyOn(multiClassicSession.differenceValidationService, 'checkDifference').mockImplementation(() => {
        //         return 5;
        //     });
        //     jest.spyOn(multiClassicSession.differenceValidationService, 'getDifferencePixelList').mockReturnValue([{ x: 11, y: 10 }]);
        //     jest.spyOn(multiClassicSession, 'verifyGameWon').mockReturnValue('');

        //     soloClassicSession.players[0].differencesFound = [5];

        //     const result = multiClassicSession.tryGuess({ x: 11, y: 10 }, firstSocketId);
        //     expect(result).toEqual({ isCorrect: false, differencesByPlayer: [[firstSocketId, 1]], differencePixelList: [], winnerName: '' });
        // });

        // it('tryguess returns incorrect result when no difference', () => {
        //     jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
        //         return true;
        //     });
        //     jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
        //         return null;
        //     });
        //     jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
        //         return undefined;
        //     });
        //     jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockImplementation(() => {
        //         return [{ x: 11, y: 10 }];
        //     });
        //     jest.spyOn(Session.prototype, 'verifyGameWon').mockReturnValue('');
        //     sessionMulti.differencesFoundByPlayer = [[firstSocketId, [5]]];

        //     const result = sessionMulti.tryGuess({ x: 11, y: 10 }, firstSocketId);
        //     expect(result).toEqual({ isCorrect: false, differencesByPlayer: [[firstSocketId, 1]], differencePixelList: [], winnerName: '' });
        // });
    });
    describe('getNotFoundDifferences', () => {
        it('should return all the differences', () => {
            soloClassicSession.differenceValidationService.differenceCoordLists = [
                [{ x: 11, y: 10 }],
                [{ x: 12, y: 10 }],
                [{ x: 13, y: 10 }],
                [{ x: 14, y: 10 }],
            ];
            jest.spyOn(soloClassicSession, 'isDiffAlreadyFound' as any).mockImplementation(() => {
                return false;
            });
            const returnedValue: Coordinate[][] = soloClassicSession.getNotFoundDifferences();
            expect(returnedValue).toEqual([[{ x: 11, y: 10 }], [{ x: 12, y: 10 }], [{ x: 13, y: 10 }], [{ x: 14, y: 10 }]]);
        });

        // it('should return 4 of the differences', () => {
        //     soloClassicSession.differenceValidationService.differenceCoordLists = [
        //         [{ x: 11, y: 10 }],
        //         [{ x: 12, y: 10 }],
        //         [{ x: 13, y: 10 }],
        //         [{ x: 14, y: 10 }],
        //     ];
        //     jest.spyOn(soloClassicSession, 'isDiffAlreadyFound' as any).mockImplementationOnce(() => {
        //         return false;
        //     });
        //     jest.spyOn(soloClassicSession, 'isDiffAlreadyFound' as any).mockImplementation(() => {
        //         return true;
        //     });
        //     const returnedValue: Coordinate[][] = soloClassicSession.getNotFoundDifferences();
        //     expect(returnedValue).toEqual([[{ x: 11, y: 10 }], [{ x: 12, y: 10 }], [{ x: 13, y: 10 }], [{ x: 14, y: 10 }]]);
        // });

        it('should return no differences', () => {
            soloClassicSession.differenceValidationService.differenceCoordLists = [
                [{ x: 11, y: 10 }],
                [{ x: 12, y: 10 }],
                [{ x: 13, y: 10 }],
                [{ x: 14, y: 10 }],
            ];
            jest.spyOn(soloClassicSession, 'isDiffAlreadyFound' as any).mockImplementation(() => {
                return true;
            });
            const returnedValue: Coordinate[][] = soloClassicSession.getNotFoundDifferences();
            expect(returnedValue).toEqual([]);
        });
    });

    describe('buildGuessResult', () => {
        it('soloGame: should return the right guess result', () => {
            jest.spyOn(soloClassicSession, 'verifyGameWon').mockImplementation(() => {
                return undefined;
            });
            const result: GuessResult = soloClassicSession.buildGuessResult(true, [{ x: 231, y: 123 }]);
            expect(result.isCorrect).toEqual(true);
            expect(result.differencesByPlayer).toEqual([
                [soloClassicSession.players[0].socketId, soloClassicSession.players[0].differencesFound.length],
            ]);
            expect(result.differencePixelList).toEqual([{ x: 231, y: 123 }]);
            expect(result.winnerName).toBeUndefined();
        });
        it('multiGame: should return the right guess result', () => {
            jest.spyOn(multiClassicSession, 'verifyGameWon').mockImplementation(() => {
                return undefined;
            });
            const result: GuessResult = multiClassicSession.buildGuessResult(true, [{ x: 231, y: 123 }]);
            expect(result.isCorrect).toEqual(true);
            expect(result.differencesByPlayer).toEqual([
                [multiClassicSession.players[0].socketId, multiClassicSession.players[0].differencesFound.length],
                [multiClassicSession.players[1].socketId, multiClassicSession.players[1].differencesFound.length],
            ]);
            expect(result.differencePixelList).toEqual([{ x: 231, y: 123 }]);
            expect(result.winnerName).toBeUndefined();
        });
        it('soloGame: should return the right guess result', () => {
            jest.spyOn(soloClassicSession, 'verifyGameWon').mockImplementation(() => {
                return soloClassicSession.players[0].socketId;
            });
            const result: GuessResult = soloClassicSession.buildGuessResult(true, [{ x: 231, y: 123 }]);
            expect(result.isCorrect).toEqual(true);
            expect(result.differencesByPlayer).toEqual([
                [soloClassicSession.players[0].socketId, soloClassicSession.players[0].differencesFound.length],
            ]);
            expect(result.differencePixelList).toEqual([{ x: 231, y: 123 }]);
            expect(result.winnerName).toEqual(soloClassicSession.players[0].socketId);
        });
        it('multiClassicSession: should return the right guess result', () => {
            jest.spyOn(multiClassicSession, 'verifyGameWon').mockImplementation(() => {
                return multiClassicSession.players[1].socketId;
            });
            const result: GuessResult = multiClassicSession.buildGuessResult(true, [{ x: 231, y: 123 }]);
            expect(result.isCorrect).toEqual(true);
            expect(result.differencesByPlayer).toEqual([
                [multiClassicSession.players[0].socketId, multiClassicSession.players[0].differencesFound.length],
                [multiClassicSession.players[1].socketId, multiClassicSession.players[1].differencesFound.length],
            ]);
            expect(result.differencePixelList).toEqual([{ x: 231, y: 123 }]);
            expect(result.winnerName).toEqual(multiClassicSession.players[1].socketId);
        });
    });

    describe('verifyGameWon', () => {
        it('soloGame: should return undefined', () => {
            soloClassicSession.nDifferences = 5;
            soloClassicSession.players[0].differencesFound = [1, 2, 3, 4];
            const response: string = soloClassicSession.verifyGameWon();
            expect(response).toBeUndefined();
        });
        it('soloGame: should return the socketId', () => {
            soloClassicSession.nDifferences = 7;
            soloClassicSession.players[0].differencesFound = [1, 2, 3, 4, 5, 6, 7];
            const response: string = soloClassicSession.verifyGameWon();
            expect(response).toEqual(soloClassicSession.players[0].socketId);
        });
        it('multiGame: should return undefined', () => {
            multiClassicSession.nDifferences = 7;
            multiClassicSession.players[0].differencesFound = [1, 2, 3];
            multiClassicSession.players[1].differencesFound = [];
            const response: string = multiClassicSession.verifyGameWon();
            expect(response).toBeUndefined();
        });
        it('multiGame: should return undefined', () => {
            multiClassicSession.nDifferences = 4;
            multiClassicSession.players[0].differencesFound = [];
            multiClassicSession.players[1].differencesFound = [1, 2, 3];
            const response: string = multiClassicSession.verifyGameWon();
            expect(response).toEqual(multiClassicSession.players[1].socketId);
        });
    });

    describe('handleClueRequest', () => {
        it('should return true and add the number of clue requested', () => {
            soloClassicSession.nbCluesRequested = 0;
            soloClassicSession.time = 0;
            const response: boolean = soloClassicSession.handleClueRequest();
            expect(response).toEqual(true);
            expect(soloClassicSession.nbCluesRequested).toEqual(1);
            expect(soloClassicSession.time).toEqual(5);
        });

        it('should return false and add the number of clue requested', () => {
            soloClassicSession.nbCluesRequested = 3;
            soloClassicSession.time = 0;
            const response: boolean = soloClassicSession.handleClueRequest();
            expect(response).toEqual(false);
            expect(soloClassicSession.nbCluesRequested).toEqual(4);
            expect(soloClassicSession.time).toEqual(0);
        });
    });
});
