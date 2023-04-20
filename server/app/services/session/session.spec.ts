/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, max-lines, no-restricted-imports, max-len */

import { Player } from '@common/player';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { DifferenceValidationService } from '../difference-validation/difference-validation.service';
import { Session } from './session';

describe('Session tests', () => {
    let session: Session;
    let differenceValidationService: SinonStubbedInstance<DifferenceValidationService>;

    beforeAll(async () => {
        differenceValidationService = createStubInstance<DifferenceValidationService>(DifferenceValidationService);
        differenceValidationService.differenceCoordLists = [[{ x: 0, y: 0 }]];

        const moduleRef: TestingModule = await Test.createTestingModule({
            providers: [
                Session,
                {
                    provide: DifferenceValidationService,
                    useValue: differenceValidationService,
                },
            ],
        }).compile();

        session = moduleRef.get<Session>(Session);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    describe('isSolo', () => {
        it('returns true when one player', () => {
            const playerStub: Player = { name: 'name', socketId: 'socketId', differencesFound: [] };
            session.players = [playerStub];
            expect(session.isSolo).toEqual(true);
        });
    });

    describe('formatedTime', () => {
        it('returns the right time', () => {
            session.time = 1234;
            expect(session.formatedTime).toEqual('20:34');
        });
    });

    describe('stopTime', () => {
        it('should call clearInterval', () => {
            session.timerId = setInterval(() => {
                return false;
            }, 10);
            const oldTimerId = session.timerId;
            session.stopTimer();
            expect(session.timerId).toEqual(oldTimerId);
        });
    });
});
// describe('tryGuess function', () => {
//     const gameId = 'gameId';
//     const firstSocketId = 'firstSocketId';
//     const secondSocketId = 'secondSocketId';
//     jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
//         // eslint-disable-next-line no-invalid-this
//         DifferenceValidationService.prototype.differenceCoordLists = [[]];
//     });
//     // jest.spyOn(DifferenceValidationService.prototype['differenceCoordLists'], 'length').mockReturnValue(4);
//     // jest.spyOn();
//     const sessionSolo = new Session(gameId, firstSocketId);
//     const sessionMulti = new Session(gameId, firstSocketId, secondSocketId);
//     it('SoloPlayer Game: tryguess should throw error if validateGuess returns false', () => {
//         jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
//             return false;
//         });
//         let error: Error;

//         try {
//             sessionSolo.tryGuess({ x: 12, y: 13 }, firstSocketId);
//         } catch (e) {
//             error = e;
//         }
//         expect(error).toEqual(new Error('Mauvais format de guess.'));
//     });

//     // it('tryguess should return a guessResult with correct as true if it is not in the list of differecnes found', () => {
//     //     jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
//     //         return true;
//     //     });
//     //     jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
//     //         return 5;
//     //     });
//     //     jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockImplementation(() => {
//     //         return [{ x: 11, y: 10 }];
//     //     });
//     //     jest.spyOn(Session.prototype, 'buildGuessResult').mockReturnValue({
//     //         isCorrect: true,
//     //         differencesByPlayer: [],
//     //         differencePixelList: [],
//     //         winnerName: '',
//     //     });
//     //     sessionSolo.differencesFoundByPlayer = [];
//     //     sessionSolo.tryGuess({ x: 11, y: 10 }, firstSocketId);
//     //     // expect(sessionSolo.isDiffAlreadyFound).toEqual(false);
//     //     expect(sessionSolo.buildGuessResult).toHaveBeenCalledWith(true, [{ x: 11, y: 10 }]);
//     //     // expect(result.guessResult).toEqual({ guessResult: { isCorrect: true, differencesByPlayer: [], differencePixelList: [] } });
//     //     // expect(result.gameWonBy).toBeUndefined();
//     // });

//     it('SoloPlayer Game: tryguess detects when difference already found  and the guess is incorrect', () => {
//         jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
//             return true;
//         });
//         jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
//             return null;
//         });
//         jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
//             return 5;
//         });
//         jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockReturnValue([
//             { x: 11, y: 10 },
//             { x: 1, y: 1 },
//         ]);
//         jest.spyOn(Session.prototype, 'verifyGameWon').mockReturnValue('');

//         sessionSolo.differencesFoundByPlayer = [[firstSocketId, [5]]];

//         const result = sessionSolo.tryGuess({ x: 11, y: 10 }, firstSocketId);
//         expect(result).toEqual({ isCorrect: false, differencesByPlayer: [[firstSocketId, 1]], differencePixelList: [], winnerName: '' });
//     });

//     it('SoloPlayer Game: tryguess returns incorrect result when no difference', () => {
//         jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
//             return true;
//         });
//         jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
//             return null;
//         });
//         jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
//             return undefined;
//         });
//         jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockImplementation(() => {
//             return [{ x: 11, y: 10 }];
//         });
//         jest.spyOn(Session.prototype, 'verifyGameWon').mockReturnValue('');

//         sessionSolo.differencesFoundByPlayer = [[firstSocketId, [5]]];

//         const result = sessionSolo.tryGuess({ x: 11, y: 10 }, firstSocketId);
//         expect(result).toEqual({ isCorrect: false, differencesByPlayer: [[firstSocketId, 1]], differencePixelList: [], winnerName: '' });
//     });

//     it('SoloPlayer Game: tryguess should throw error if validateGuess returns false', () => {
//         jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
//             return false;
//         });
//         let error: Error;

//         try {
//             sessionMulti.tryGuess({ x: 12, y: 13 }, firstSocketId);
//         } catch (e) {
//             error = e;
//         }
//         expect(error).toEqual(new Error('Mauvais format de guess.'));
//     });

//     it('SoloPlayer Game: tryguess should catch and throw error if error in the the first try', () => {
//         jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
//             throw new Error('Error test');
//         });
//         let error: Error;

//         try {
//             sessionMulti.tryGuess({ x: 12, y: 13 }, firstSocketId);
//         } catch (e) {
//             error = e;
//         }
//         expect(error).toEqual(new Error('Error test'));
//     });

//     it('SoloPlayer Game: tryguess should call the right functions for this turn of events', () => {
//         jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
//             return true;
//         });
//         jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
//             return null;
//         });
//         jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
//             return 3;
//         });
//         const getDiffPixListSpy = jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockImplementation(() => {
//             return [{ x: 11, y: 10 }];
//         });

//         jest.spyOn(Session.prototype, 'verifyGameWon').mockReturnValue('');

//         sessionSolo.differencesFoundByPlayer = [[firstSocketId, [5]]];

//         const result = sessionSolo.tryGuess({ x: 11, y: 10 }, firstSocketId);
//         expect(getDiffPixListSpy).toHaveBeenCalled();
//         expect(result).toEqual({
//             isCorrect: true,
//             differencesByPlayer: [[firstSocketId, 2]],
//             differencePixelList: [{ x: 11, y: 10 }],
//             winnerName: '',
//         });
//     });

//     it('MultiPlayerGame: tryguess should return a guessResult with correct as true if it is not in the list of differecnes found', () => {
//         jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
//             return true;
//         });
//         jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
//             return 5;
//         });
//         jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockImplementation(() => {
//             return [{ x: 11, y: 10 }];
//         });
//         jest.spyOn(Session.prototype, 'verifyGameWon').mockReturnValue('');
//         sessionMulti.differencesFoundByPlayer = [];
//         const result = sessionSolo.tryGuess({ x: 11, y: 10 }, firstSocketId);
//         expect(result).toEqual({ isCorrect: false, differencesByPlayer: [[firstSocketId, 2]], differencePixelList: [], winnerName: '' });
//     });

//     it('tryguess detects when difference already found', () => {
//         jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
//             return true;
//         });
//         jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
//             return null;
//         });
//         jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
//             return 5;
//         });
//         jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockReturnValue([{ x: 11, y: 10 }]);
//         jest.spyOn(Session.prototype, 'verifyGameWon').mockReturnValue('');

//         sessionMulti.differencesFoundByPlayer = [[firstSocketId, [5]]];

//         const result = sessionMulti.tryGuess({ x: 11, y: 10 }, firstSocketId);
//         expect(result).toEqual({ isCorrect: false, differencesByPlayer: [[firstSocketId, 1]], differencePixelList: [], winnerName: '' });
//     });

//     it('tryguess returns incorrect result when no difference', () => {
//         jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
//             return true;
//         });
//         jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
//             return null;
//         });
//         jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
//             return undefined;
//         });
//         jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockImplementation(() => {
//             return [{ x: 11, y: 10 }];
//         });
//         jest.spyOn(Session.prototype, 'verifyGameWon').mockReturnValue('');
//         sessionMulti.differencesFoundByPlayer = [[firstSocketId, [5]]];

//         const result = sessionMulti.tryGuess({ x: 11, y: 10 }, firstSocketId);
//         expect(result).toEqual({ isCorrect: false, differencesByPlayer: [[firstSocketId, 1]], differencePixelList: [], winnerName: '' });
//     });
// });

// TODO: Doit mock le service de validation des différences dans Session

// describe('stopTimer', () => {
//     let gameId: string;
//     let firstSocketId: string;
//     let session: Session;

//     beforeEach(() => {
//         gameId = 'gameId';
//         firstSocketId = 'firstSocketId';
//         session = new Session(gameId, firstSocketId);
//     });

//     it('stopTime should call the clearInterval', () => {
//         jest.useFakeTimers();
//         session.timerId = setInterval(() => {
//             session.timeElapsed++;
//         }, SECOND_IN_MILLISECONDS);
//         jest.advanceTimersByTime(SECOND_IN_MILLISECONDS * 5);
//         session.stopTimer();
//         jest.advanceTimersByTime(SECOND_IN_MILLISECONDS * 5);
//         expect(session.timeElapsed).toEqual(5);
//     });
// });

// describe('getClue', () => {
//     const gameId = 'gameId';
//     const firstSocketId = 'firstSocketId';
//     const session: Session = new Session(gameId, firstSocketId);
//     beforeEach(() => {
//         session.nbCluesRequested = 0;
//         session.timeElapsed = 0;
//     });

//     it('should return a clue', async () => {
//         const clue = await session.getClue(5);
//         expect(instanceOfClue(clue)).toBeTruthy();
//     });

//     it('should return nothing if nbCluesRequested >= 3', async () => {
//         session.nbCluesRequested = 3;
//         expect(await session.getClue(5)).toEqual(undefined);
//         session.nbCluesRequested = 5;
//         expect(await session.getClue(5)).toEqual(undefined);
//     });

//     it('should add one request to the nbCluesRequested', async () => {
//         await session.getClue(5);
//         expect(session.nbCluesRequested).toEqual(1);
//     });

//     it('should add the time indicated by the penalty to the total timer time', async () => {
//         await session.getClue(5);
//         expect(session.timeElapsed).toEqual(5);
//     });
// });

//     describe('verifyGameWon', () => {
//         const gameId = 'gameId';
//         const firstSocketId = 'firstSocketId';
//         const secondSocketId = 'secondSocketId';
//         const sessionSolo = new Session(gameId, firstSocketId);
//         const sessionMulti = new Session(gameId, firstSocketId, secondSocketId);
//         it('soloGame: should return undefined when no winner', () => {
//             jest.spyOn(Session.prototype, 'isSolo', 'get').mockReturnValue(true);
//             sessionSolo.nDifferences = 3;
//             sessionSolo.differencesFoundByPlayer = [[firstSocketId, [3, 3]]];
//             const result: string = sessionSolo.verifyGameWon();
//             expect(result).toBeUndefined();
//         });

//         it('soloGame: should return the socket id of the winner', () => {
//             jest.spyOn(Session.prototype, 'isSolo', 'get').mockReturnValue(true);
//             sessionSolo.nDifferences = 3;
//             sessionSolo.differencesFoundByPlayer = [[firstSocketId, [1, 2, 3]]];
//             const result: string = sessionSolo.verifyGameWon();
//             expect(result).toEqual(firstSocketId);
//         });

//         it('multiGame: should return undefined when no winner', () => {
//             jest.spyOn(Session.prototype, 'isSolo', 'get').mockReturnValue(false);
//             sessionMulti.nDifferences = 3;
//             sessionMulti.differencesFoundByPlayer = [
//                 [firstSocketId, [1]],
//                 [secondSocketId, [2]],
//             ];
//             const result: string = sessionMulti.verifyGameWon();
//             expect(result).toBeUndefined();
//         });

//         it('multiGame: should return the socket id of the winner if its the first id', () => {
//             jest.spyOn(Session.prototype, 'isSolo', 'get').mockReturnValue(false);
//             sessionMulti.nDifferences = 3;
//             sessionMulti.differencesFoundByPlayer = [
//                 [firstSocketId, [1, 2]],
//                 [secondSocketId, [3]],
//             ];
//             const result: string = sessionMulti.verifyGameWon();
//             expect(result).toEqual(firstSocketId);
//         });
//         it('multiGame: should return the socket id of the winner if its the first id', () => {
//             jest.spyOn(Session.prototype, 'isSolo', 'get').mockReturnValue(false);
//             sessionMulti.nDifferences = 3;
//             sessionMulti.differencesFoundByPlayer = [
//                 [firstSocketId, [1]],
//                 [secondSocketId, [2, 3]],
//             ];
//             const result: string = sessionMulti.verifyGameWon();
//             expect(result).toEqual(secondSocketId);
//         });
//     });

//     describe('isDiffAlreadyFound', () => {
//         const gameId = 'gameId';
//         const firstSocketId = 'firstSocketId';
//         const secondSocketId = 'secondSocketId';
//         const sessionSolo = new Session(gameId, firstSocketId);
//         const sessionMulti = new Session(gameId, firstSocketId, secondSocketId);
//         it('soloGame: should return false when the difference hasnt been found yet', () => {
//             sessionSolo.differencesFoundByPlayer = [[firstSocketId, [1, 2, 3, 4, 6, 7, 8, 9, 10, 11]]];
//             const result: boolean = sessionSolo['isDiffAlreadyFound'](5);
//             expect(result).toEqual(false);
//         });
//         it('soloGame: should return true when the difference has been found yet', () => {
//             sessionSolo.differencesFoundByPlayer = [[firstSocketId, [1, 2, 3, 4, 6, 7, 8, 9, 10, 11]]];
//             const result: boolean = sessionSolo['isDiffAlreadyFound'](4);
//             expect(result).toEqual(true);
//         });

//         it('multiGame: should return false when the difference hasnt been found yet', () => {
//             sessionMulti.differencesFoundByPlayer = [
//                 [firstSocketId, [1, 2, 3, 4, 6, 7, 8, 9, 10, 11]],
//                 [secondSocketId, [12, 13, 14, 15, 16, 17, 18]],
//             ];
//             const result: boolean = sessionMulti['isDiffAlreadyFound'](5);
//             expect(result).toEqual(false);
//         });
//         it('multiGame: should return true when the difference has been found yet by the first player', () => {
//             sessionMulti.differencesFoundByPlayer = [
//                 [firstSocketId, [1, 2, 3, 4, 6, 7, 8, 9, 10, 11]],
//                 [secondSocketId, [12, 13, 14, 15, 16, 17, 18]],
//             ];
//             const result: boolean = sessionMulti['isDiffAlreadyFound'](4);
//             expect(result).toEqual(true);
//         });
//         it('multiGame: should return true when the difference has been found yet by the second player', () => {
//             sessionMulti.differencesFoundByPlayer = [
//                 [firstSocketId, [1, 2, 3, 4, 6, 7, 8, 9, 10, 11]],
//                 [secondSocketId, [12, 13, 14, 15, 16, 17, 18]],
//             ];
//             const result: boolean = sessionMulti['isDiffAlreadyFound'](12);
//             expect(result).toEqual(true);
//         });
//     });

//     describe('getDiffTupleIndex', () => {
//         const gameId = 'gameId';
//         const firstSocketId = 'firstSocketId';
//         const secondSocketId = 'secondSocketId';
//         const sessionMulti = new Session(gameId, firstSocketId, secondSocketId);
//         it('allGameTypes:should return the index the of the firstSocketId', () => {
//             const result: number = sessionMulti['getDiffTupleIndex'](firstSocketId);
//             expect(result).toEqual(0);
//         });
//         it('allGameTypes:should return the index the of the firstSocketId', () => {
//             const result: number = sessionMulti['getDiffTupleIndex'](secondSocketId);
//             expect(result).toEqual(1);
//         });
//     });

//     describe('get formatedTimeElapsed', () => {
//         const gameId = 'gameId';
//         const firstSocketId = 'firstSocketId';
//         const secondSocketId = 'secondSocketId';
//         const sessionMulti = new Session(gameId, firstSocketId, secondSocketId);
//         it('should return the right time in mm:ss', () => {
//             sessionMulti.timeElapsed = 0;
//             const result: string = sessionMulti.formatedTimeElapsed;
//             expect(result).toEqual('0:00');
//         });
//     });
