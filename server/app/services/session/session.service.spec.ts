/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, max-lines, no-restricted-imports, max-len */
import { Clue } from '@common/clue';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { ClueService } from '../clue/clue.service';
import { DifferenceValidationService } from '../difference-validation/difference-validation.service';
import { GameService } from '../game/game.service';
import { ClassicSession } from './classic-session';
import { Session } from './session';
import { SessionService } from './session.service';
jest.mock('./classic-session');

describe('Session Service tests', () => {
    let session: SinonStubbedInstance<Session>;
    let sessionService: SessionService;
    let differenceValidationService: SinonStubbedInstance<DifferenceValidationService>;
    let stubClassicSession: SinonStubbedInstance<ClassicSession>;
    let clueService: SinonStubbedInstance<ClueService>;
    beforeAll(async () => {
        differenceValidationService = createStubInstance<DifferenceValidationService>(DifferenceValidationService);
        clueService = createStubInstance<ClueService>(ClueService);
        stubClassicSession = createStubInstance<ClassicSession>(ClassicSession);
        session = createStubInstance<Session>(Session);
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
                    useValue: clueService,
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

    describe('generateClue', () => {
        const stubClientId = 'fakeId123';
        let findByClientIdSpy: jest.SpyInstance;
        let clueServiceGenerateClueSpy: jest.SpyInstance;
        let stubClue: Clue;
        beforeEach(() => {
            stubClassicSession.nbCluesRequested = 0;
            findByClientIdSpy = jest.spyOn(sessionService, 'findByClientId').mockReturnValue(stubClassicSession);
            clueServiceGenerateClueSpy = jest.spyOn(clueService, 'generateClue').mockReturnValue({} as Clue);
            stubClue = {} as Clue;
        });

        it('should return a clue', async () => {
            const clue = sessionService.generateClue(stubClientId);
            expect(clue).toEqual(stubClue);
        });
        it('should call findByClientId and clueService.generateClue', async () => {
            sessionService.generateClue(stubClientId);
            expect(findByClientIdSpy).toBeCalledTimes(1);
            expect(clueServiceGenerateClueSpy).toBeCalledTimes(1);
        });
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
