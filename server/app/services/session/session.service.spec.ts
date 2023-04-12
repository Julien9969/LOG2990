/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, max-lines, no-restricted-imports, max-len */
import { Coordinate } from '@common/coordinate';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { ClueService } from '../clue/clue.service';
import { DifferenceValidationService } from '../difference-validation/difference-validation.service';
import { GameService } from '../game/game.service';
import { Session } from './session';
import { SessionService } from './session.service';

describe('Session Service tests', () => {
    let sessionService: SessionService;
    let session: SinonStubbedInstance<Session>;
    let differenceValidationService: SinonStubbedInstance<DifferenceValidationService>;

    const exampleId = 'asd123123';
    const badId = 'bbbbsfojdsafo1232';
    const exampleName = 'michel';
    const newExampleName = 'Julien Sr.';
    const exampleDictionnary = { asd123123: 'michel', dqqwee12313: 'victor', dasd123: 'Seb', jksoj78: 'Maxime' };

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
    it('addName should add a new name to the nameDictionnary if it doesnt exists', async () => {
        const spy = jest.spyOn(sessionService, 'addName');
        sessionService.socketIdToName = {};
        sessionService.addName(exampleId, exampleName);
        expect(spy).toHaveBeenCalled();
        expect(sessionService.socketIdToName[exampleId]).toEqual(exampleName);
    });

    it('addName should replace the name in the nameDictionnary if it exists', async () => {
        const spy = jest.spyOn(sessionService, 'addName');
        sessionService.socketIdToName = exampleDictionnary;
        expect(sessionService.socketIdToName[exampleId]).toEqual(exampleName);
        sessionService.addName(exampleId, newExampleName);
        expect(spy).toHaveBeenCalled();
        expect(sessionService.socketIdToName[exampleId]).toEqual(newExampleName);
    });
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
    it('getName should return the name if it is in the  dictionnary', async () => {
        const spy = jest.spyOn(sessionService, 'getName');
        sessionService.socketIdToName = {};
        sessionService.addName(exampleId, exampleName);

        const result = sessionService.getName('asd123123');

        expect(spy).toHaveBeenCalled();
        expect(sessionService.socketIdToName['asd123123']).toEqual('michel');
        expect(result).toEqual('michel');
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

    describe('createNewSession', () => {
        const firstSocketId = 'firstSocketId';
        const secondSocketId = 'secondSocketId';
        it('soloGame: create should create a session return a number and call addToList', async () => {
            const newSessionId = 1;
            const spy = jest.spyOn(sessionService, 'addToList').mockImplementation(() => {
                return newSessionId;
            });
            jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {});
            const result = await sessionService.createNewSession('12', firstSocketId);
            expect(typeof result === 'number').toBeTruthy();
            expect(spy).toHaveBeenCalled();
        });
        it('multiGame: create should create a session return a number and call addToList', async () => {
            const newSessionId = 1;
            const spy = jest.spyOn(sessionService, 'addToList').mockImplementation(() => {
                return newSessionId;
            });
            jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {});
            const result = await sessionService.createNewSession('12', firstSocketId, secondSocketId);
            expect(typeof result === 'number').toBeTruthy();
            expect(spy).toHaveBeenCalled();
        });
    });
    describe('addToList', () => {
        it('should call generateUniqueId and put the value to the session.id and push the new session', () => {
            sessionService.addToList(session);
            expect(sessionService.activeSessions).toEqual([session]);
        });

        it('session getNotFoundDifferences should return a list of difference', () => {
            const gameId = 'gameId';
            const firstSocketId = 'firstSocketId';
            const secondSocketId = 'secondSocketId';
            jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {});
            const sessionMulti = new Session(gameId, firstSocketId, secondSocketId);
            sessionMulti.differenceValidationService = { differenceCoordLists: [[], []] } as any;
            sessionMulti.differencesFoundByPlayer = [
                [firstSocketId, []],
                [secondSocketId, []],
            ];
            const result: Coordinate[][] = sessionMulti.getNotFoundDifferences();
            expect(result).toEqual([[], []]);
        });
    });
    describe('findBy', () => {
        const session2: SinonStubbedInstance<Session> = createStubInstance<Session>(Session);
        const session3: SinonStubbedInstance<Session> = createStubInstance<Session>(Session);
        const session4: SinonStubbedInstance<Session> = createStubInstance<Session>(Session);
        const session5: SinonStubbedInstance<Session> = createStubInstance<Session>(Session);
        const session6: SinonStubbedInstance<Session> = createStubInstance<Session>(Session);
        const socketId = 'socketId';
        const socketId2 = 'socketId2';
        const socketId3 = 'socketId3';
        const socketId4 = 'socketId4';
        const socketId5 = 'socketId5';
        const socketId6 = 'socketId6';
        const socketId7 = 'socketId7';
        const socketId8 = 'socketId8';
        session2.id = 2;
        session3.id = 3;
        session4.id = 4;
        session5.id = 5;
        session6.id = 6;
        session2.differencesFoundByPlayer = [
            [socketId3, []],
            [socketId4, []],
        ];
        session3.differencesFoundByPlayer = [
            [socketId5, []],
            [socketId2, []],
        ];
        session4.differencesFoundByPlayer = [[socketId7, []]];
        session5.differencesFoundByPlayer = [[socketId8, []]];
        session6.differencesFoundByPlayer = [[socketId6, []]];
        it('findByClientId should return the right session', () => {
            session.differencesFoundByPlayer = [
                [socketId, []],
                [socketId2, []],
            ];
            sessionService.activeSessions = [session2, session3, session4, session, session5, session6];
            const result: Session = sessionService.findByClientId(socketId);
            expect(result).toEqual(session);
        });
        it('findByClientId should return undefined when the session isnt found', () => {
            sessionService.activeSessions = [session2, session3, session4, session5, session6];
            const result: Session = sessionService.findByClientId(socketId);
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
});
