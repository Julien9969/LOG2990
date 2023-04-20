/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, max-lines, no-restricted-imports, max-len */
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { ClueService } from '../clue/clue.service';
import { DifferenceValidationService } from '../difference-validation/difference-validation.service';
import { GameService } from '../game/game.service';
import { ClassicSession } from './classic-session';
import { Session } from './session';
import { SessionService } from './session.service';
jest.mock('./classic-session');
// jest.mock('./limited-time-session');

describe('Session Service tests', () => {
    let sessionService: SessionService;
    let session: SinonStubbedInstance<Session>;
    let differenceValidationService: SinonStubbedInstance<DifferenceValidationService>;

    // TODO : Analyser si ces commentaires sont nécessaires pour les tests
    // const exampleId = 'asd123123';
    // const badId = 'bbbbsfojdsafo1232';
    // const exampleName = 'michel';
    // const newExampleName = 'Julien Sr.';
    // const exampleDictionnary = { asd123123: 'michel', dqqwee12313: 'victor', dasd123: 'Seb', jksoj78: 'Maxime' };

    beforeAll(async () => {
        session = createStubInstance<Session>(Session);
        differenceValidationService = createStubInstance<DifferenceValidationService>(DifferenceValidationService);
        differenceValidationService.differenceCoordLists = [[{ x: 0, y: 0 }]];

        const moduleRef: TestingModule = await Test.createTestingModule({
            providers: [
                SessionService,
                {
                    provide: GameService,
                    useValue: {
                        getGameConstants: () => {
                            return {
                                time: 100,
                                penalty: 5,
                                reward: 10,
                            };
                        },
                    },
                },
                {
                    provide: ClueService,
                    useValue: {},
                },
                {
                    provide: Session,
                    useValue: session,
                },
                {
                    provide: DifferenceValidationService,
                    useValue: differenceValidationService,
                },
            ],
        }).compile();

        sessionService = moduleRef.get<SessionService>(SessionService);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('service should be defined', async () => {
        expect(sessionService).toBeDefined();
    });

    describe('addName', () => {
        const exampleId = 'socketId';
        const exampleName = 'name';
        const newExampleName = 'newName';
        it('addName should add a new name to the nameDictionnary if it doesnt exists', async () => {
            const spy = jest.spyOn(sessionService, 'addName');
            sessionService.socketIdToName = {};
            sessionService.addName(exampleId, exampleName);
            expect(spy).toHaveBeenCalled();
            expect(sessionService.socketIdToName[exampleId]).toEqual(exampleName);
        });

        it('addName should replace the name in the nameDictionnary if it exists', async () => {
            const spy = jest.spyOn(sessionService, 'addName');
            const exampleDictionnary = {};
            exampleDictionnary[exampleId] = exampleName;
            sessionService.socketIdToName = exampleDictionnary;
            expect(sessionService.socketIdToName[exampleId]).toEqual(exampleName);
            sessionService.addName(exampleId, newExampleName);
            expect(spy).toHaveBeenCalled();
            expect(sessionService.socketIdToName[exampleId]).toEqual(newExampleName);
        });
    });

    describe('removeName', () => {
        const exampleId = 'socketId';
        const exampleName = 'name';
        const exampleDictionnary = {};
        exampleDictionnary[exampleId] = exampleName;
        it('removeName should remove the name in the nameDictionnary if it exists', async () => {
            const spy = jest.spyOn(sessionService, 'removeName');
            sessionService.socketIdToName = exampleDictionnary;
            expect(sessionService.socketIdToName[exampleId]).toBeTruthy();
            sessionService.removeName(exampleId);
            expect(spy).toHaveBeenCalled();
            expect(sessionService.socketIdToName[exampleId]).toBeFalsy();
        });
        it('removeName should not throw an error if it the name is not in the dictionnary ', async () => {
            const spy = jest.spyOn(sessionService, 'removeName');
            sessionService.socketIdToName = {};
            try {
                sessionService.removeName(exampleId);
            } catch (e) {
                fail('removeName has thrown an error');
            }
            expect(spy).toHaveBeenCalled();
            expect(sessionService.socketIdToName[exampleId]).toBeFalsy();
        });
    });

    describe('getName', () => {
        const exampleId = 'socketId';
        const badId = 'badSocketId';
        const exampleName = 'name';
        const exampleDictionnary = {};
        exampleDictionnary[exampleId] = exampleName;
        it('getName should return the name if it is in the  dictionnary', async () => {
            const getNamespy = jest.spyOn(sessionService, 'getName');
            sessionService.socketIdToName = exampleDictionnary;
            const result = sessionService.getName(exampleId);

            expect(getNamespy).toHaveBeenCalled();
            expect(result).toEqual(exampleName);
        });

        it('getName should not throw an error if it the name is not in the dictionnary, instead returning null ', async () => {
            const spy = jest.spyOn(sessionService, 'getName');
            sessionService.socketIdToName = {};
            let result: string;
            try {
                result = sessionService.getName(badId);
            } catch (error) {
                fail('getName has thrown an error');
            }
            expect(spy).toHaveBeenCalled();
            expect(result).toEqual(undefined);
        });
    });

    describe('createNewSession', () => {
        const firstSocketId = 'firstSocketId';
        const secondSocketId = 'secondSocketId';
        it('classic soloGame: create should create a session return a number and call addToList', () => {
            const newSessionId = 1;
            const spy = jest.spyOn(sessionService, 'addToList').mockImplementation(() => {
                return newSessionId;
            });
            jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {});
            const result = sessionService.createNewClassicSession('12', firstSocketId);
            expect(result).toEqual(1);
            expect(spy).toHaveBeenCalled();
        });
        it('classic multiGame: create should create a session return a number and call addToList', () => {
            const newSessionId = 1;
            const spy = jest.spyOn(sessionService, 'addToList').mockImplementation(() => {
                return newSessionId;
            });
            jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {});
            const result = sessionService.createNewClassicSession('12', firstSocketId, secondSocketId);
            expect(result).toEqual(1);
            expect(spy).toHaveBeenCalled();
        });
        it('limited time soloGame: create should create a session return a number and call addToList', () => {
            const newSessionId = 1;
            const spy = jest.spyOn(sessionService, 'addToList').mockImplementation(() => {
                return newSessionId;
            });
            jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {});
            const result = sessionService.createNewLimitedTimeSession(firstSocketId);
            expect(result).toEqual(1);
            expect(spy).toHaveBeenCalled();
        });
        it('limited time multiGame: create should create a session return a number and call addToList', () => {
            const newSessionId = 1;
            const spy = jest.spyOn(sessionService, 'addToList').mockImplementation(() => {
                return newSessionId;
            });
            jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {});
            const result = sessionService.createNewLimitedTimeSession(firstSocketId, secondSocketId);
            expect(result).toEqual(1);
            expect(spy).toHaveBeenCalled();
        });
    });
    describe('findBy', () => {
        const session2: ClassicSession = { id: 'session2', players: [] } as any;
        const session3: SinonStubbedInstance<ClassicSession> = { id: 'session3', players: [] } as any;
        const session4: SinonStubbedInstance<ClassicSession> = { id: 'session4', players: [] } as any;
        const session5: SinonStubbedInstance<ClassicSession> = { id: 'session5', players: [] } as any;
        const session6: SinonStubbedInstance<ClassicSession> = { id: 'session6', players: [] } as any;

        const socketId = 'socketId';
        const socketId2 = 'socketId2';
        const socketId3 = 'socketId3';
        const socketId4 = 'socketId4';
        const socketId6 = 'socketId6';
        const socketId7 = 'socketId7';
        const socketId8 = 'socketId8';

        session2.id = 2;
        session3.id = 3;
        session4.id = 4;
        session5.id = 5;
        session6.id = 6;

        session2.players[0] = { socketId: socketId3, name: 'name1', differencesFound: [] };
        session2.players[1] = { socketId: socketId4, name: 'name1', differencesFound: [] };

        session3.players[0] = { socketId: socketId3, name: 'name1', differencesFound: [] };
        session3.players[1] = { socketId: socketId2, name: 'name1', differencesFound: [] };

        session4.players[0] = { socketId: socketId7, name: 'name1', differencesFound: [] };

        session5.players[0] = { socketId: socketId8, name: 'name1', differencesFound: [] };

        session6.players[0] = { socketId: socketId6, name: 'name1', differencesFound: [] };

        it('findByClientId should return the right session', () => {
            session2.players[0] = { socketId, name: 'name1', differencesFound: [] };
            session2.players[1] = { socketId: socketId2, name: 'name1', differencesFound: [] };
            sessionService.activeSessions = [session2, session3, session4, session, session5, session6];
            const result: Session = sessionService.findByClientId(socketId);
            expect(result).toEqual(session2);
        });
        it('findByClientId should return undefined when the session isnt found', () => {
            sessionService.activeSessions = [session2, session3, session4, session5, session6];
            const result: Session = sessionService.findByClientId('otherSocketId');
            expect(result).toBeUndefined();
        });
        it('findBySesssionId should return the right session', () => {
            session.id = 1;
            sessionService.activeSessions = [session2, session3, session4, session, session5, session6];
            const result: Session = sessionService.findBySessionId(session.id);
            expect(result).toEqual(session);
        });
        it('findBySesssionId should return undefined', () => {
            session.id = 1;
            sessionService.activeSessions = [session2, session3, session4, session5, session6];
            const result: Session = sessionService.findBySessionId(session.id);
            expect(result).toBeUndefined();
        });
    });

    describe('generateUniqueId', () => {
        it('should call the right functions', () => {
            const mathSpy = jest.spyOn(Math, 'floor').mockImplementation(() => {
                return 3;
            });
            jest.spyOn(SessionService.prototype, 'findBySessionId').mockImplementation(() => {
                return undefined;
            });
            jest.spyOn(SessionService.prototype, 'findBySessionId').mockReturnValueOnce(session);
            const number = sessionService['generateUniqueId']();
            expect(number).toEqual(3);
            expect(mathSpy).toHaveBeenCalledTimes(2);
        });
    });
    describe('addToList', () => {
        it('should call generateUniqueId and put the value to the session.id and push the new session', () => {
            sessionService.activeSessions = [];
            const spy = jest.spyOn(sessionService['activeSessions'], 'push').mockImplementation(() => {
                return null;
            });
            sessionService.addToList(session);
            expect(spy).toHaveBeenCalledWith(session);
        });
    });
    describe('delete', () => {
        const classicGameStub = {
            isTimeLimited: false,
            players: [{ name: 'name1' }, { name: 'name2' }],
            deletePlayer: (idSocket: string) => {
                return idSocket;
            },
        };
        const soloLimitedTimeGameStub = {
            isTimeLimited: true,
            players: [{ name: 'name1' }, { name: 'name2' }],
            deletePlayer: (idSocket: string) => {
                return idSocket;
            },
        };
        const multiLimitedTimeGameStub = {
            isTimeLimited: true,
            players: [{ name: 'name1' }, { name: 'name2' }],
            deletePlayer: (idSocket: string) => {
                return idSocket;
            },
        };
        const deletePlayerSpy = jest.spyOn(classicGameStub, 'deletePlayer');

        const id = 123;
        const index = 1;
        const socketId = 'socketId';
        it('Classic Session should call deleteFromActiveSessions with the right index', () => {
            const deleteFromActiveSessionsSpy = jest.spyOn(sessionService, 'deleteFromActiveSessions').mockImplementation();
            jest.spyOn(Array.prototype, 'indexOf').mockImplementation(() => {
                return index;
            });
            const findBySpy = jest.spyOn(sessionService, 'findBySessionId').mockImplementation(() => {
                return classicGameStub as any;
            });
            sessionService.activeSessions = [{ id: 'session0' }, { id: 'session1' }] as any;
            sessionService.delete(id, socketId);
            expect(findBySpy).toHaveBeenCalledWith(id);
            expect(deletePlayerSpy).not.toHaveBeenCalledWith(socketId);
            expect(deleteFromActiveSessionsSpy).toHaveBeenCalledWith(index);
        });

        it('solo LimiteTimeSession Session should call deleteFromActiveSessions with the right index', () => {
            const deleteFromActiveSessionsSpy = jest.spyOn(sessionService, 'deleteFromActiveSessions').mockImplementation();
            jest.spyOn(Array.prototype, 'indexOf').mockImplementation(() => {
                return index;
            });
            const findBySpy = jest.spyOn(sessionService, 'findBySessionId').mockImplementation(() => {
                return soloLimitedTimeGameStub as any;
            });
            sessionService.activeSessions = [{ id: 'session0' }, { id: 'session1' }] as any;
            sessionService.delete(id, socketId);
            expect(findBySpy).toHaveBeenCalledWith(id);
            expect(deletePlayerSpy).not.toHaveBeenCalledWith(socketId);
            expect(deleteFromActiveSessionsSpy).not.toHaveBeenCalledWith(index);
        });

        it('multi LimiteTimeSession Session should call deleteFromActiveSessions with the right index', () => {
            const deleteFromActiveSessionsSpy = jest.spyOn(sessionService, 'deleteFromActiveSessions').mockImplementation();
            jest.spyOn(Array.prototype, 'indexOf').mockImplementation(() => {
                return index;
            });
            const findBySpy = jest.spyOn(sessionService, 'findBySessionId').mockImplementation(() => {
                return multiLimitedTimeGameStub as any;
            });
            sessionService.activeSessions = [{ id: 'session0' }, { id: 'session1' }] as any;
            sessionService.delete(id, socketId);
            expect(findBySpy).toHaveBeenCalledWith(id);
            expect(deletePlayerSpy).not.toHaveBeenCalledWith(socketId);
            expect(deleteFromActiveSessionsSpy).not.toHaveBeenCalledWith(index);
        });
    });

    describe('deleteFromActiveSessions', () => {
        it('should stopTimer and splice', () => {
            const sessionStub = { id: 'session0', stopTimer: () => {} };
            const sessionStub1 = { id: 'session1', stopTimer: () => {} };

            sessionService.activeSessions = [sessionStub, sessionStub1] as any;
            const stopTimerSpy = jest.spyOn(sessionStub, 'stopTimer');
            sessionService.deleteFromActiveSessions(0);
            expect(stopTimerSpy).toHaveBeenCalled();
            expect(sessionService.activeSessions).toEqual([sessionStub1]);
        });
    });
    describe('generateClue', () => {
        it('should call generate clue', () => {
            const sessionStub = { id: 'session0' };

            sessionService['clueService' as any] = { generateClue: () => {} };
            jest.spyOn(sessionService, 'findByClientId').mockImplementation(() => {
                return sessionStub as any;
            });
            jest.spyOn(sessionService['clueService'], 'generateClue').mockImplementation(() => {
                return { coordinates: [{ x: 123, y: 123 }], nbCluesLeft: 4 };
            });
            const response = sessionService.generateClue('socketId');
            expect(response).toEqual({ coordinates: [{ x: 123, y: 123 }], nbCluesLeft: 4 });
        });
    });
});

//     describe('tryGuess function', () => {
//         const gameId = 'gameId';
//         const firstSocketId = 'firstSocketId';
//         const secondSocketId = 'secondSocketId';
//         jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
//             // eslint-disable-next-line no-invalid-this
//             DifferenceValidationService.prototype.differenceCoordLists = [[]];
//         });
//         // jest.spyOn(DifferenceValidationService.prototype['differenceCoordLists'], 'length').mockReturnValue(4);
//         // jest.spyOn();
//         const sessionSolo = new Session(gameId, firstSocketId);
//         const sessionMulti = new Session(gameId, firstSocketId, secondSocketId);
//         it('SoloPlayer Game: tryguess should throw error if validateGuess returns false', () => {
//             jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
//                 return false;
//             });
//             let error: Error;

//             try {
//                 sessionSolo.tryGuess({ x: 12, y: 13 }, firstSocketId);
//             } catch (e) {
//                 error = e;
//             }
//             expect(error).toEqual(new Error('Mauvais format de guess.'));
//         });

//         // it('tryguess should return a guessResult with correct as true if it is not in the list of differecnes found', () => {
//         //     jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
//         //         return true;
//         //     });
//         //     jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
//         //         return 5;
//         //     });
//         //     jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockImplementation(() => {
//         //         return [{ x: 11, y: 10 }];
//         //     });
//         //     jest.spyOn(Session.prototype, 'buildGuessResult').mockReturnValue({
//         //         isCorrect: true,
//         //         differencesByPlayer: [],
//         //         differencePixelList: [],
//         //         winnerName: '',
//         //     });
//         //     sessionSolo.differencesFoundByPlayer = [];
//         //     sessionSolo.tryGuess({ x: 11, y: 10 }, firstSocketId);
//         //     // expect(sessionSolo.isDiffAlreadyFound).toEqual(false);
//         //     expect(sessionSolo.buildGuessResult).toHaveBeenCalledWith(true, [{ x: 11, y: 10 }]);
//         //     // expect(result.guessResult).toEqual({ guessResult: { isCorrect: true, differencesByPlayer: [], differencePixelList: [] } });
//         //     // expect(result.gameWonBy).toBeUndefined();
//         // });

//         it('SoloPlayer Game: tryguess detects when difference already found  and the guess is incorrect', () => {
//             jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
//                 return true;
//             });
//             jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
//                 return null;
//             });
//             jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
//                 return 5;
//             });
//             jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockReturnValue([
//                 { x: 11, y: 10 },
//                 { x: 1, y: 1 },
//             ]);
//             jest.spyOn(Session.prototype, 'verifyGameWon').mockReturnValue('');

//             sessionSolo.differencesFoundByPlayer = [[firstSocketId, [5]]];

//             const result = sessionSolo.tryGuess({ x: 11, y: 10 }, firstSocketId);
//             expect(result).toEqual({ isCorrect: false, differencesByPlayer: [[firstSocketId, 1]], differencePixelList: [], winnerName: '' });
//         });

//         it('SoloPlayer Game: tryguess returns incorrect result when no difference', () => {
//             jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
//                 return true;
//             });
//             jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
//                 return null;
//             });
//             jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
//                 return undefined;
//             });
//             jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockImplementation(() => {
//                 return [{ x: 11, y: 10 }];
//             });
//             jest.spyOn(Session.prototype, 'verifyGameWon').mockReturnValue('');

//             sessionSolo.differencesFoundByPlayer = [[firstSocketId, [5]]];

//             const result = sessionSolo.tryGuess({ x: 11, y: 10 }, firstSocketId);
//             expect(result).toEqual({ isCorrect: false, differencesByPlayer: [[firstSocketId, 1]], differencePixelList: [], winnerName: '' });
//         });

//         it('SoloPlayer Game: tryguess should throw error if validateGuess returns false', () => {
//             jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
//                 return false;
//             });
//             let error: Error;

//             try {
//                 sessionMulti.tryGuess({ x: 12, y: 13 }, firstSocketId);
//             } catch (e) {
//                 error = e;
//             }
//             expect(error).toEqual(new Error('Mauvais format de guess.'));
//         });

//         it('SoloPlayer Game: tryguess should catch and throw error if error in the the first try', () => {
//             jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
//                 throw new Error('Error test');
//             });
//             let error: Error;

//             try {
//                 sessionMulti.tryGuess({ x: 12, y: 13 }, firstSocketId);
//             } catch (e) {
//                 error = e;
//             }
//             expect(error).toEqual(new Error('Error test'));
//         });

//         it('SoloPlayer Game: tryguess should call the right functions for this turn of events', () => {
//             jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
//                 return true;
//             });
//             jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
//                 return null;
//             });
//             jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
//                 return 3;
//             });
//             const getDiffPixListSpy = jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockImplementation(() => {
//                 return [{ x: 11, y: 10 }];
//             });
//             jest.spyOn(sessionSolo, 'isDiffAlreadyFound' as any).mockReturnValue(false);
//             jest.spyOn(Session.prototype, 'verifyGameWon').mockReturnValue('');

//             sessionSolo.differencesFoundByPlayer = [[firstSocketId, [5]]];

//             const result = sessionSolo.tryGuess({ x: 11, y: 10 }, firstSocketId);
//             expect(getDiffPixListSpy).toHaveBeenCalled();
//             expect(result).toEqual({
//                 isCorrect: true,
//                 differencesByPlayer: [[firstSocketId, 2]],
//                 differencePixelList: [{ x: 11, y: 10 }],
//                 winnerName: '',
//             });
//         });

//         it('MultiPlayerGame: tryguess should return a guessResult with correct as true if it is not in the list of differecnes found', () => {
//             jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
//                 return true;
//             });
//             jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
//                 return 5;
//             });
//             jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockImplementation(() => {
//                 return [{ x: 11, y: 10 }];
//             });
//             jest.spyOn(Session.prototype, 'verifyGameWon').mockReturnValue('');
//             sessionMulti.differencesFoundByPlayer = [];
//             const result = sessionSolo.tryGuess({ x: 11, y: 10 }, firstSocketId);
//             expect(result).toEqual({ isCorrect: false, differencesByPlayer: [[firstSocketId, 2]], differencePixelList: [], winnerName: '' });
//         });

//         it('tryguess detects when difference already found', () => {
//             jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
//                 return true;
//             });
//             jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
//                 return null;
//             });
//             jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
//                 return 5;
//             });
//             jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockReturnValue([{ x: 11, y: 10 }]);
//             jest.spyOn(Session.prototype, 'verifyGameWon').mockReturnValue('');

//             sessionMulti.differencesFoundByPlayer = [[firstSocketId, [5]]];

//             const result = sessionMulti.tryGuess({ x: 11, y: 10 }, firstSocketId);
//             expect(result).toEqual({ isCorrect: false, differencesByPlayer: [[firstSocketId, 1]], differencePixelList: [], winnerName: '' });
//         });

//         it('tryguess returns incorrect result when no difference', () => {
//             jest.spyOn(DifferenceValidationService.prototype, 'validateGuess').mockImplementation(() => {
//                 return true;
//             });
//             jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
//                 return null;
//             });
//             jest.spyOn(DifferenceValidationService.prototype, 'checkDifference').mockImplementation(() => {
//                 return undefined;
//             });
//             jest.spyOn(DifferenceValidationService.prototype, 'getDifferencePixelList').mockImplementation(() => {
//                 return [{ x: 11, y: 10 }];
//             });
//             jest.spyOn(Session.prototype, 'verifyGameWon').mockReturnValue('');
//             sessionMulti.differencesFoundByPlayer = [[firstSocketId, [5]]];

//             const result = sessionMulti.tryGuess({ x: 11, y: 10 }, firstSocketId);
//             expect(result).toEqual({ isCorrect: false, differencesByPlayer: [[firstSocketId, 1]], differencePixelList: [], winnerName: '' });
//         });
//     });
//     // TODO: Doit mock le service de validation des différences dans Session

//     // describe('stopTimer', () => {
//     //     let gameId: string;
//     //     let firstSocketId: string;
//     //     let session: Session;

//     //     beforeEach(() => {
//     //         gameId = 'gameId';
//     //         firstSocketId = 'firstSocketId';
//     //         session = new Session(gameId, firstSocketId);
//     //     });

//     //     it('stopTime should call the clearInterval', () => {
//     //         jest.useFakeTimers();
//     //         session.timerId = setInterval(() => {
//     //             session.timeElapsed++;
//     //         }, SECOND_IN_MILLISECONDS);
//     //         jest.advanceTimersByTime(SECOND_IN_MILLISECONDS * 5);
//     //         session.stopTimer();
//     //         jest.advanceTimersByTime(SECOND_IN_MILLISECONDS * 5);
//     //         expect(session.timeElapsed).toEqual(5);
//     //     });
//     // });
//     describe('getClue', () => {
//         const gameId = 'gameId';
//         const firstSocketId = 'firstSocketId';
//         const session: Session = new Session(gameId, firstSocketId);
//         beforeEach(() => {
//             session.nbCluesRequested = 0;
//             session.timeElapsed = 0;
//         });

//         it('should return a clue', async () => {
//             const clue = await session.getClue(5);
//             expect(instanceOfClue(clue)).toBeTruthy();
//         });

//         it('should return nothing if nbCluesRequested >= 3', async () => {
//             session.nbCluesRequested = 3;
//             expect(await session.getClue(5)).toEqual(undefined);
//             session.nbCluesRequested = 5;
//             expect(await session.getClue(5)).toEqual(undefined);
//         });

//         it('should add one request to the nbCluesRequested', async () => {
//             await session.getClue(5);
//             expect(session.nbCluesRequested).toEqual(1);
//         });

//         it('should add the time indicated by the penalty to the total timer time', async () => {
//             await session.getClue(5);
//             expect(session.timeElapsed).toEqual(5);
//         });
//     });

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
// });

// describe('Session Service tests', () => {
//     beforeAll(async () => {
//         sessionService = new SessionService();
//     });
//     let session: SinonStubbedInstance<Session>;
//     let differenceValidationService: SinonStubbedInstance<DifferenceValidationService>;
//     beforeEach(async () => {
//         // Session.mockImplementation(() => sessionStub);
//         session = createStubInstance<Session>(Session);
//         differenceValidationService = createStubInstance<DifferenceValidationService>(DifferenceValidationService);
//         const module: TestingModule = await Test.createTestingModule({
//             providers: [
//                 SessionService,
//                 {
//                     provide: Session,
//                     useValue: session,
//                 },
//                 {
//                     provide: DifferenceValidationService,
//                     useValue: differenceValidationService,
//                 },
//             ],
//         }).compile();

//         sessionService = module.get<SessionService>(SessionService);
//     });
//     afterEach(() => {
//         jest.restoreAllMocks();
//         jest.clearAllMocks();
//     });

//     it('session getNotFoundDifferences should return a list of difference', () => {
//         const gameId = 'gameId';
//         const firstSocketId = 'firstSocketId';
//         const secondSocketId = 'secondSocketId';

//         jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {});
//         const sessionMulti = new Session(gameId, firstSocketId, secondSocketId);

//         sessionMulti.differenceValidationService = { differenceCoordLists: [[], []] } as any;
//         sessionMulti.differencesFoundByPlayer = [
//             [firstSocketId, []],
//             [secondSocketId, []],
//         ];
//         const result: Coordinate[][] = sessionMulti.getNotFoundDifferences();
//         expect(result).toEqual([[], []]);
//     });
