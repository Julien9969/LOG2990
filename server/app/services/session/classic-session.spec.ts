/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import { GameConstants } from '@common/game-constants';
// import { Test, TestingModule } from '@nestjs/testing';
import mongoose from 'mongoose';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { DifferenceValidationService } from '@app/services/difference-validation/difference-validation.service';
import { GameService } from '@app/services/game/game.service';
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
    let classicSession: ClassicSession;
    let differenceValidationService: SinonStubbedInstance<DifferenceValidationService>;
    // let session: SinonStubbedInstance<Session>;
    let gameServiceStub: GameService;

    beforeEach(async () => {
        differenceValidationService = createStubInstance<DifferenceValidationService>(DifferenceValidationService);
        differenceValidationService.differenceCoordLists = [[{ x: 0, y: 0 }]];
        // gameService = createStubInstance<GameService>(GameService);
        // session = createStubInstance<Session>(Session);
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

        // const module: TestingModule = await Test.createTestingModule({
        //     providers: [
        //         ClassicSession,
        //         {
        //             provide: DifferenceValidationService,
        //             useValue: differenceValidationService,
        //         },
        //         {
        //             provide: Session,
        //             useValue: session,
        //         },
        //         {
        //             provide: GameService,
        //             useValue: gameServiceStub,
        //         },
        //     ],
        // }).compile();

        // classicSession = module.get<ClassicSession>(ClassicSession);
        const gameID = 'gameId';
        const players = [
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
        classicSession = new ClassicSession(gameServiceStub as GameService, gameID, players);
        // gameServiceStub.getGameConstants();
        classicSession.differenceValidationService = differenceValidationService;
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('service should be defined', async () => {
        expect(classicSession).toBeDefined();
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
            jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
                return false;
            });

            jest.spyOn(mongoose, 'isValidObjectId').mockReturnValue(true);

            let error: Error;

            try {
                classicSession.tryGuess({ x: 12, y: 13 }, firstSocketId);
            } catch (e) {
                error = e;
            }
            expect(error).toEqual(new Error('Mauvais format de guess.'));
        });

        // it('tryguess should return a guessResult with correct as true if it is not in the list of differecnes found', () => {
        //     jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
        //         return true;
        //     });
        //     jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
        //         return 5;
        //     });
        //     jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockImplementation(() => {
        //         return [{ x: 11, y: 10 }];
        //     });
        //     jest.spyOn(Session.prototype, 'buildGuessResult').mockReturnValue({
        //         isCorrect: true,
        //         differencesByPlayer: [],
        //         differencePixelList: [],
        //         winnerName: '',
        //     });
        //     sessionSolo.differencesFoundByPlayer = [];
        //     sessionSolo.tryGuess({ x: 11, y: 10 }, firstSocketId);
        //     // expect(sessionSolo.isDiffAlreadyFound).toEqual(false);
        //     expect(sessionSolo.buildGuessResult).toHaveBeenCalledWith(true, [{ x: 11, y: 10 }]);
        //     // expect(result.guessResult).toEqual({ guessResult: { isCorrect: true, differencesByPlayer: [], differencePixelList: [] } });
        //     // expect(result.gameWonBy).toBeUndefined();
        // });

        // it('SoloPlayer Game: tryguess detects when difference already found  and the guess is incorrect', () => {
        //     jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
        //         return true;
        //     });
        //     jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
        //         return null;
        //     });
        //     jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
        //         return 5;
        //     });
        //     jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockReturnValue([
        //         { x: 11, y: 10 },
        //         { x: 1, y: 1 },
        //     ]);
        //     jest.spyOn(Session.prototype, 'verifyGameWon').mockReturnValue('');

        //     sessionSolo.differencesFoundByPlayer = [[firstSocketId, [5]]];

        //     const result = sessionSolo.tryGuess({ x: 11, y: 10 }, firstSocketId);
        //     expect(result).toEqual({ isCorrect: false, differencesByPlayer: [[firstSocketId, 1]], differencePixelList: [], winnerName: '' });
        // });

        // it('SoloPlayer Game: tryguess returns incorrect result when no difference', () => {
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

        //     sessionSolo.differencesFoundByPlayer = [[firstSocketId, [5]]];

        //     const result = sessionSolo.tryGuess({ x: 11, y: 10 }, firstSocketId);
        //     expect(result).toEqual({ isCorrect: false, differencesByPlayer: [[firstSocketId, 1]], differencePixelList: [], winnerName: '' });
        // });

        // it('SoloPlayer Game: tryguess should throw error if validateGuess returns false', () => {
        //     jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
        //         return false;
        //     });
        //     let error: Error;

        //     try {
        //         sessionMulti.tryGuess({ x: 12, y: 13 }, firstSocketId);
        //     } catch (e) {
        //         error = e;
        //     }
        //     expect(error).toEqual(new Error('Mauvais format de guess.'));
        // });

        // it('SoloPlayer Game: tryguess should catch and throw error if error in the the first try', () => {
        //     jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
        //         throw new Error('Error test');
        //     });
        //     let error: Error;

        //     try {
        //         sessionMulti.tryGuess({ x: 12, y: 13 }, firstSocketId);
        //     } catch (e) {
        //         error = e;
        //     }
        //     expect(error).toEqual(new Error('Error test'));
        // });

        // it('SoloPlayer Game: tryguess should call the right functions for this turn of events', () => {
        //     jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
        //         return true;
        //     });
        //     jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
        //         return null;
        //     });
        //     jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
        //         return 3;
        //     });
        //     const getDiffPixListSpy = jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockImplementation(() => {
        //         return [{ x: 11, y: 10 }];
        //     });

        //     jest.spyOn(Session.prototype, 'verifyGameWon').mockReturnValue('');

        //     sessionSolo.differencesFoundByPlayer = [[firstSocketId, [5]]];

        //     const result = sessionSolo.tryGuess({ x: 11, y: 10 }, firstSocketId);
        //     expect(getDiffPixListSpy).toHaveBeenCalled();
        //     expect(result).toEqual({
        //         isCorrect: true,
        //         differencesByPlayer: [[firstSocketId, 2]],
        //         differencePixelList: [{ x: 11, y: 10 }],
        //         winnerName: '',
        //     });
        // });

        // it('MultiPlayerGame: tryguess should return a guessResult with correct as true if it is not in the list of differecnes found', () => {
        //     jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
        //         return true;
        //     });
        //     jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
        //         return 5;
        //     });
        //     jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockImplementation(() => {
        //         return [{ x: 11, y: 10 }];
        //     });
        //     jest.spyOn(Session.prototype, 'verifyGameWon').mockReturnValue('');
        //     sessionMulti.differencesFoundByPlayer = [];
        //     const result = sessionSolo.tryGuess({ x: 11, y: 10 }, firstSocketId);
        //     expect(result).toEqual({ isCorrect: false, differencesByPlayer: [[firstSocketId, 2]], differencePixelList: [], winnerName: '' });
        // });

        // it('tryguess detects when difference already found', () => {
        //     jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
        //         return true;
        //     });
        //     jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
        //         return null;
        //     });
        //     jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
        //         return 5;
        //     });
        //     jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockReturnValue([{ x: 11, y: 10 }]);
        //     jest.spyOn(Session.prototype, 'verifyGameWon').mockReturnValue('');

        //     sessionMulti.differencesFoundByPlayer = [[firstSocketId, [5]]];

        //     const result = sessionMulti.tryGuess({ x: 11, y: 10 }, firstSocketId);
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
});
