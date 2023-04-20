/* eslint-disable max-lines, @typescript-eslint/no-explicit-any -- utilisés pour spy sur des fonctions privés */
/* eslint-disable no-unused-vars -- necessaire pour la conformite des types, dans les fonctions des mock */
/* eslint-disable prefer-arrow/prefer-arrow-functions, max-lines, @typescript-eslint/no-magic-numbers, @typescript-eslint/no-empty-function */
import { SECOND_IN_MILLISECONDS } from '@app/gateway/constants/utils-constants';
import { GameService } from '@app/services/game/game.service';
import { ClassicSession } from '@app/services/session/classic-session';
import { Session } from '@app/services/session/session';
import { SessionService } from '@app/services/session/session.service';
import { LimitedTimeSession } from '@app/services/session/time-limited-session';
import { Coordinate } from '@common/coordinate';
import { Game } from '@common/game';
import { GuessResult } from '@common/guess-result';
import { SessionEvents } from '@common/session.gateway.events';
import { StartSessionData } from '@common/start-session-data';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { Server, Socket } from 'socket.io';
import { SessionGateway } from './session.gateway';
import { secondStubSocket, stubGameId, stubSession, stubSocket } from './session.gateway.spec.const';

describe('SessionGateway', () => {
    let gateway: SessionGateway;
    let logger: SinonStubbedInstance<Logger>;
    let socket: Socket;
    let server: SinonStubbedInstance<Server>;
    let sessionService: SinonStubbedInstance<SessionService>;
    let gameService: SinonStubbedInstance<GameService>;
    let session: SinonStubbedInstance<ClassicSession>;

    // Spy globaux
    let logSpy: jest.SpyInstance;
    let logErrorSpy: jest.SpyInstance;
    let serverEmitSpy: jest.SpyInstance;
    let serverTo: jest.SpyInstance;
    let serverAllSocketsSpy: jest.SpyInstance;

    beforeEach(async () => {
        logger = createStubInstance<Logger>(Logger);
        socket = createStubInstance<Socket>(Socket);
        socket = stubSocket;
        server = createStubInstance<Server>(Server);
        sessionService = createStubInstance<SessionService>(SessionService);
        gameService = createStubInstance<GameService>(GameService);
        session = createStubInstance<ClassicSession>(ClassicSession);
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessionGateway,
                {
                    provide: Socket,
                    useValue: socket,
                },
                {
                    provide: Logger,
                    useValue: logger,
                },
                {
                    provide: SessionService,
                    useValue: sessionService,
                },
                {
                    provide: GameService,
                    useValue: gameService,
                },
                {
                    provide: Session,
                    useValue: session,
                },
            ],
        }).compile();

        gateway = module.get<SessionGateway>(SessionGateway);
        gateway['server'] = server;
        jest.spyOn(logger, 'log').mockImplementation();
        jest.spyOn(logger, 'error').mockImplementation();
    });

    beforeEach(() => {
        const allSocketsStub = new Set([stubSocket.id, secondStubSocket.id]);
        logSpy = jest.spyOn(logger, 'log').mockImplementation(() => {});
        logErrorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});
        jest.spyOn(gameService, 'getGameConstants').mockImplementation(() => {
            return {
                time: 100,
                penalty: 10,
                reward: 10,
            };
        });
        serverEmitSpy = jest.fn(() => {});
        serverAllSocketsSpy = jest.fn(() => {
            return allSocketsStub;
        });
        serverTo = jest.spyOn(server, 'to').mockImplementation(() => {
            return {
                emit: serverEmitSpy,
                except: serverTo,
            } as any;
        });
        jest.spyOn(server, 'in').mockImplementation(() => {
            return {
                allSockets: serverAllSocketsSpy,
            } as any;
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('getClientId', () => {
        it('should return client socket Id', () => {
            jest.spyOn(logger, 'log');
            expect(gateway.getClientId(socket)).toEqual(socket.id);
            expect(logger.log).toHaveBeenCalledWith(`Client ${socket.id} has requested his socket Id`);
        });
        it('should call the right log', () => {
            jest.spyOn(logger, 'log');
            gateway.getClientId(socket);
            expect(logger.log).toHaveBeenCalledWith(`Client ${socket.id} has requested his socket Id`);
        });
    });

    // describe('handleClueRequest', () => {
    //     let findSessionByClientIdSpy: jest.SpyInstance;
    //     let getClueSpy: jest.SpyInstance;
    //     beforeEach(() => {
    //         findSessionByClientIdSpy = jest.spyOn(sessionService, 'findByClientId').mockImplementation(() => stubSession);
    //         getClueSpy = jest.spyOn(stubSession, 'getClue').mockImplementation(() => {
    //             return {
    //                 coordinates: [{ x: 0, y: 0 }],
    //                 nbCluesLeft: 2,
    //             } as Clue;
    //         });
    //     });

    //     it('should call sessionService.findByClientId & gameService.findById', async () => {
    //         await gateway.handleClueRequest(stubSocket);
    //         expect(findSessionByClientIdSpy).toBeCalled();
    //     });

    //     it('should getClue from the correct session', async () => {
    //         await gateway.handleClueRequest(stubSocket);
    //         expect(getClueSpy).toBeCalledWith(gameService.getGameConstants().penalty);
    //     });
    // });

    describe('leaveRoom', () => {
        it('should make the client leave the room', () => {
            const gameId = '1';
            const roomId = `gameRoom-room${gameId}`;
            const leaveSpy = jest.spyOn(stubSocket, 'leave');
            gateway.leaveRoom(stubSocket);

            expect(leaveSpy).toHaveBeenCalledWith(roomId);
        });
    });

    describe('handleCoordinatesSubmission', () => {
        let findBySessionIdSpy: jest.SpyInstance;
        let tryGuessSpy: jest.SpyInstance;
        let sendSystemMessageSpy: jest.SpyInstance;
        let playerWonSpy: jest.SpyInstance;

        const stubGuess: [number, Coordinate] = [11, { x: 1, y: 3 }];
        let testSessionClassic: ClassicSession;
        let testSessionLimitedTime: LimitedTimeSession;

        beforeEach(() => {
            findBySessionIdSpy = jest.spyOn(sessionService, 'findBySessionId').mockImplementation(() => stubSession);
            tryGuessSpy = jest.spyOn(stubSession, 'tryGuess');
            sendSystemMessageSpy = jest.spyOn(gateway, 'sendSystemMessage').mockImplementation();
            playerWonSpy = jest.spyOn(gateway, 'playerWon').mockImplementation();
        });

        describe('when solo session', () => {
            beforeEach(() => {
                testSessionClassic = {
                    time: 100,
                    gameID: 'game-id',
                    isSolo: true,
                    stopTimer: () => {},
                    tryGuess: (coord, id) => {},
                } as ClassicSession;
                findBySessionIdSpy.mockImplementation(() => {
                    return testSessionClassic;
                });
            });

            it('tries to guess', () => {
                findBySessionIdSpy.mockImplementation(() => {
                    return stubSession;
                });
                gateway.handleCoordinatesSubmissionSolo(stubSocket, stubGuess);

                expect(tryGuessSpy).toBeCalled();
            });

            it('sends system message when incorrect guess', () => {
                tryGuessSpy = jest.spyOn(testSessionClassic, 'tryGuess').mockImplementation(() => {
                    return {
                        isCorrect: false,
                        winnerName: '',
                    } as GuessResult;
                });

                gateway.handleCoordinatesSubmissionSolo(stubSocket, stubGuess);

                expect(logSpy).toBeCalled();
                expect(sendSystemMessageSpy).toBeCalledWith(stubSocket, 'guess_bad');
                expect(playerWonSpy).not.toBeCalled();
            });

            it('tries guess and sends system message when correct but no winner name', () => {
                tryGuessSpy = jest.spyOn(testSessionClassic, 'tryGuess').mockImplementation(() => {
                    return {
                        isCorrect: true,
                        winnerName: '',
                    } as GuessResult;
                });

                gateway.handleCoordinatesSubmissionSolo(stubSocket, stubGuess);

                expect(tryGuessSpy).toBeCalled();
                expect(sendSystemMessageSpy).toBeCalledWith(stubSocket, 'guess_good');
                expect(playerWonSpy).not.toBeCalled();
            });

            it('tries guess and sends system message when correct, and calls playerWon', () => {
                tryGuessSpy = jest.spyOn(testSessionClassic, 'tryGuess').mockImplementation(() => {
                    return {
                        isCorrect: true,
                        winnerName: 'winner',
                    } as GuessResult;
                });

                gateway.handleCoordinatesSubmissionSolo(stubSocket, stubGuess);

                expect(tryGuessSpy).toBeCalled();
                expect(playerWonSpy).toBeCalled();
            });
        });

        describe('when multiplayer session', () => {
            beforeEach(() => {
                testSessionClassic = {
                    time: 100,
                    gameID: 'game-id',
                    isSolo: false,
                    stopTimer: () => {},
                    tryGuess: (coord, id) => {},
                } as ClassicSession;
                findBySessionIdSpy.mockImplementation(() => {
                    return testSessionClassic;
                });
            });

            it('tries guess and sends system message and log when incorrect, and emits message to client', () => {
                tryGuessSpy = jest.spyOn(testSessionClassic, 'tryGuess').mockImplementation(() => {
                    return {
                        isCorrect: false,
                        winnerName: '',
                    } as GuessResult;
                });
                const clientEmitSpy = jest.spyOn(stubSocket, 'emit');

                gateway.handleCoordinatesSubmissionMulti(stubSocket, stubGuess);

                expect(tryGuessSpy).toBeCalled();
                expect(logSpy).toBeCalled();
                expect(sendSystemMessageSpy).toBeCalledWith(stubSocket, 'guess_bad');
                expect(clientEmitSpy).toBeCalled();
            });

            it('tries guess and sends system message when correct', () => {
                tryGuessSpy = jest.spyOn(testSessionClassic, 'tryGuess').mockImplementation(() => {
                    return {
                        isCorrect: true,
                        winnerName: 'winner',
                    } as GuessResult;
                });
                const clientEmitSpy = jest.spyOn(stubSocket, 'emit');

                gateway.handleCoordinatesSubmissionMulti(stubSocket, stubGuess);

                expect(tryGuessSpy).toBeCalled();
                expect(clientEmitSpy).not.toBeCalled();
            });
        });

        it('does not try guessing when invalid session and warns in log', () => {
            findBySessionIdSpy.mockImplementationOnce(() => undefined);
            gateway.handleCoordinatesSubmissionMulti(stubSocket, stubGuess);

            expect(findBySessionIdSpy).toBeCalled();
            expect(logSpy).toBeCalled();
            expect(tryGuessSpy).not.toBeCalled();
        });

        it('logs a message when invalid coordinates and does not emit to client', () => {
            tryGuessSpy.mockImplementationOnce(() => {
                throw new Error();
            });
            const clientEmitSpy = jest.spyOn(stubSocket, 'emit').mockImplementation();
            gateway.handleCoordinatesSubmissionMulti(stubSocket, stubGuess);

            expect(logSpy).toBeCalled();
            expect(clientEmitSpy).not.toBeCalled();
        });

        describe('when limitedTime session', () => {
            let sendNewGameSpy: jest.SpyInstance;
            beforeEach(() => {
                testSessionLimitedTime = {
                    time: 100,
                    gameID: 'game-id',
                    isSolo: false,
                    stopTimer: () => {},
                    tryGuess: (coord, id) => {},
                } as LimitedTimeSession;
                findBySessionIdSpy.mockImplementation(() => {
                    return testSessionLimitedTime;
                });
                sendNewGameSpy = jest.spyOn(gateway, 'sendNewGame').mockImplementation();
            });

            it('tries guess and sends system message and log when incorrect, and emits message to client', async () => {
                tryGuessSpy = jest.spyOn(testSessionLimitedTime, 'tryGuess').mockImplementation(async () => {
                    return {
                        isCorrect: false,
                        winnerName: '',
                    } as GuessResult;
                });
                const clientEmitSpy = jest.spyOn(stubSocket, 'emit');
                await gateway.handleCoordinatesSubmissionLimitedTime(stubSocket, stubGuess);

                expect(tryGuessSpy).toBeCalled();
                expect(sendSystemMessageSpy).toBeCalledWith(stubSocket, 'guess_bad');
                expect(clientEmitSpy).toBeCalled();
                expect(sendNewGameSpy).not.toHaveBeenCalledWith(stubSocket, testSessionLimitedTime);
            });

            it('tries guess and sends system message when correct', async () => {
                tryGuessSpy = jest.spyOn(testSessionLimitedTime, 'tryGuess').mockImplementation(async () => {
                    return {
                        isCorrect: true,
                        winnerName: 'winner',
                    } as GuessResult;
                });
                const clientEmitSpy = jest.spyOn(stubSocket, 'emit');

                await gateway.handleCoordinatesSubmissionLimitedTime(stubSocket, stubGuess);

                expect(tryGuessSpy).toBeCalled();
                expect(clientEmitSpy).toBeCalled();
                expect(sendNewGameSpy).toHaveBeenCalledWith(stubSocket, testSessionLimitedTime);
            });
        });

        it('does not try guessing when invalid session and warns in log', async () => {
            findBySessionIdSpy.mockImplementationOnce(() => undefined);
            await gateway.handleCoordinatesSubmissionLimitedTime(stubSocket, stubGuess);

            expect(findBySessionIdSpy).toBeCalled();
            expect(logSpy).toBeCalled();
            expect(tryGuessSpy).not.toBeCalled();
        });

        it('logs a message when invalid coordinates and does not emit to client', async () => {
            tryGuessSpy.mockImplementationOnce(() => {
                throw new Error();
            });
            const clientEmitSpy = jest.spyOn(stubSocket, 'emit').mockImplementation();
            await gateway.handleCoordinatesSubmissionLimitedTime(stubSocket, stubGuess);

            expect(logSpy).toBeCalled();
            expect(clientEmitSpy).not.toBeCalled();
        });
    });

    describe('cheatGetAllDifferences', () => {
        let findBySessionIdSpy: jest.SpyInstance;

        beforeEach(() => {
            findBySessionIdSpy = jest.spyOn(sessionService, 'findBySessionId').mockImplementation();
        });

        it('calls findBySessionId and returns session differences', () => {
            const testSession = {
                gameID: 'game-id',
                getNotFoundDifferences: () => {},
            } as ClassicSession;
            findBySessionIdSpy.mockImplementation(() => {
                return testSession;
            });
            const stubDifferences = [[{ x: 1, y: 1 }]];
            jest.spyOn(testSession, 'getNotFoundDifferences').mockImplementation(() => stubDifferences);

            const result = gateway.cheatGetAllDifferences(undefined, 0);
            expect(result).toEqual(stubDifferences);
        });

        it('returns undefined when session not found', () => {
            findBySessionIdSpy.mockImplementation(() => {
                return undefined;
            });

            const result = gateway.cheatGetAllDifferences(undefined, 0);
            expect(result).toBeUndefined();
        });
    });

    describe('playerLeft', () => {
        let sendSystemMessageSpy: jest.SpyInstance;
        let findBySessionIdSpy: jest.SpyInstance;
        let deleteSpy: jest.SpyInstance;
        let disconnectSpy: jest.SpyInstance;

        beforeEach(() => {
            sendSystemMessageSpy = jest.spyOn(gateway, 'sendSystemMessage').mockImplementation();
            jest.spyOn(server, 'socketsLeave').mockImplementation();
            findBySessionIdSpy = jest.spyOn(sessionService, 'findBySessionId').mockImplementation();
            deleteSpy = jest.spyOn(sessionService, 'delete').mockImplementation();
            disconnectSpy = jest.spyOn(stubSocket, 'disconnect');
        });

        it('sends system message to gameRoom, disconnects client and writes logs', () => {
            findBySessionIdSpy.mockImplementation(() => {
                return { isTimeLimited: false } as any;
            });
            gateway.playerLeft(stubSocket, 0);
            expect(sendSystemMessageSpy).toBeCalled();
            expect(disconnectSpy).toBeCalled();
            expect(logSpy).toBeCalled();
        });

        it('deletes session if found', () => {
            findBySessionIdSpy.mockImplementationOnce(() => stubSession);
            gateway.playerLeft(stubSocket, 0);

            expect(deleteSpy).toBeCalled();
            expect(logErrorSpy).not.toBeCalled();
        });

        it('logs error when delete fails', () => {
            findBySessionIdSpy.mockImplementationOnce(() => stubSession);
            deleteSpy.mockImplementationOnce(() => {
                throw new Error();
            });
            gateway.playerLeft(stubSocket, 0);

            expect(deleteSpy).toBeCalled();
            expect(logErrorSpy).toBeCalled();
        });
    });

    describe('startClassicSessionTimer', () => {
        let findBySessionIdSpy: jest.SpyInstance;

        beforeEach(() => {
            findBySessionIdSpy = jest.spyOn(sessionService, 'findBySessionId').mockImplementation();
            jest.useFakeTimers();
        });

        it('does not start timer when session not found', () => {
            findBySessionIdSpy.mockImplementation(() => undefined);
            const emitSpy = jest.spyOn(stubSocket, 'emit');

            gateway.startClassicSessionTimer(stubSocket, 0);

            jest.advanceTimersByTime(SECOND_IN_MILLISECONDS * 5);
            expect(emitSpy).not.toBeCalled();
        });

        describe('when solo game', () => {
            it('sets interval which increments time each second', () => {
                const testSession = {
                    time: 0,
                    isSolo: true,
                } as ClassicSession;
                findBySessionIdSpy.mockImplementation(() => testSession);

                gateway.startClassicSessionTimer(stubSocket, 0);

                jest.advanceTimersByTime(SECOND_IN_MILLISECONDS * 5);
                expect(testSession.time).toEqual(5);
            });

            it('interval emits time to client', () => {
                const testSession = {
                    time: 0,
                    isSolo: true,
                } as Session;
                findBySessionIdSpy.mockImplementation(() => testSession);
                const emitSpy = jest.spyOn(stubSocket, 'emit');

                gateway.startClassicSessionTimer(stubSocket, 0);

                jest.advanceTimersByTime(SECOND_IN_MILLISECONDS * 5);
                expect(emitSpy).toBeCalledTimes(5);
            });
        });

        describe('when multiplayer game', () => {
            it('sets interval which increments time each second', () => {
                const testSession = {
                    time: 0,
                    isSolo: false,
                } as Session;
                findBySessionIdSpy.mockImplementation(() => testSession);

                gateway.startClassicSessionTimer(stubSocket, stubGameId);

                jest.advanceTimersByTime(SECOND_IN_MILLISECONDS * 5);
                expect(testSession.time).toEqual(5);
            });

            it('interval emits to clients of room each second', () => {
                const testSession = {
                    time: 0,
                    isSolo: false,
                } as Session;
                findBySessionIdSpy.mockImplementation(() => testSession);

                gateway.startClassicSessionTimer(stubSocket, stubGameId);

                jest.advanceTimersByTime(SECOND_IN_MILLISECONDS * 5);
                expect(serverEmitSpy).toBeCalledTimes(5);
            });
        });
    });

    describe('playerWon', () => {
        let findBySessionIdSpy: jest.SpyInstance;
        let stopTimerSpy: jest.SpyInstance;
        let clientEmitSpy: jest.SpyInstance;
        let clientOnSpy: jest.SpyInstance;

        beforeEach(() => {
            findBySessionIdSpy = jest.spyOn(sessionService, 'findBySessionId').mockImplementation(() => {
                return stubSession;
            });
            stopTimerSpy = jest.spyOn(stubSession, 'stopTimer');
            clientEmitSpy = jest.spyOn(stubSocket, 'emit');
            clientOnSpy = jest.spyOn(stubSocket, 'on');
        });

        it('should stop timer and get session time and game id', async () => {
            await gateway.playerWon(stubSocket, stubGameId, true);

            expect(findBySessionIdSpy).toBeCalled();
            expect(stopTimerSpy).toBeCalled();
        });

        it('should emit ProvideName event and add listener to PlayerName response', async () => {
            await gateway.playerWon(stubSocket, stubGameId, true);

            expect(findBySessionIdSpy).toBeCalled();
            expect(clientEmitSpy).toBeCalledWith(SessionEvents.ProvideName);
            expect(clientOnSpy).toBeCalled();
        });

        describe('on callback of client playerName', () => {
            let addToScoreboardSpy: jest.SpyInstance;

            beforeEach(() => {
                addToScoreboardSpy = jest.spyOn(gameService, 'addToScoreboard').mockReturnValue(Promise.resolve(1));

                // Lancement du calback a chaque appel, simule une reponse du client
                clientOnSpy = jest.spyOn(stubSocket, 'on').mockImplementation((event, callback) => {
                    callback();
                    return stubSocket;
                });
            });

            it('should log an error when game deleted', async () => {
                jest.spyOn(gameService, 'addToScoreboard').mockImplementationOnce(() => {
                    throw new Error();
                });
                await gateway.playerWon(stubSocket, stubGameId, true);

                expect(addToScoreboardSpy).toBeCalled();
                expect(logErrorSpy).toBeCalled();
            });

            it('should emit a message to all client if addToScoreboard return not 0', async () => {
                jest.spyOn(gameService, 'addToScoreboard').mockReturnValue(Promise.resolve(1));
                jest.spyOn(gateway['server'], 'emit');
                const findGameSpy = jest.spyOn(gameService, 'findById').mockReturnValue(Promise.resolve({ name: 'test' } as Game));
                await gateway.playerWon(stubSocket, stubGameId, true);
                expect(findGameSpy).toBeCalled();
            });

            it('should emit winner info to client when solo game and add winner info to scoreboard', async () => {
                await gateway.playerWon(stubSocket, stubGameId, true);

                expect(addToScoreboardSpy).toBeCalled();
                expect(logSpy).toBeCalled();
                expect(serverEmitSpy).toBeCalled();
            });

            it('should emit winner info to game room when multiplayer game and add winner info to scoreboard', async () => {
                await gateway.playerWon(stubSocket, stubGameId, false);

                expect(addToScoreboardSpy).toBeCalled();
                expect(logSpy).toBeCalled();
                expect(serverEmitSpy).toBeCalled();
            });
        });
    });

    describe('getNewName', () => {
        it('should call the right functions', () => {
            const playerName = 'playerName';
            const addSpy = jest.spyOn(sessionService, 'addName').mockImplementation(() => {});
            gateway.getNewName(stubSocket, playerName);
            expect(addSpy).toHaveBeenCalledWith(stubSocket.id, playerName);
            expect(logger.log).toHaveBeenCalled();
        });
    });

    describe('closeSession', () => {
        it('should call delete and dont catch an error, and return sessionId', () => {
            const sessionId = 123;
            const deleteSpy = jest.spyOn(sessionService, 'delete').mockImplementation(() => {});
            const result = gateway.closeSession(stubSocket, sessionId);

            expect(deleteSpy).toHaveBeenCalledWith(sessionId, stubSocket.id);
            expect(logger.error).not.toHaveBeenCalled();
            expect(result).toEqual(sessionId);
        });

        it('should call delete and catch an error, and return sessionId', () => {
            const sessionId = 123;
            const error = new Error();
            const deleteSpy = jest.spyOn(sessionService, 'delete').mockImplementation(() => {
                throw error;
            });
            const result = gateway.closeSession(stubSocket, sessionId);

            expect(deleteSpy).toHaveBeenCalledWith(sessionId, stubSocket.id);
            expect(logger.error).toHaveBeenCalledWith(error);
            expect(result).toEqual(sessionId);
        });
    });

    describe('StartSession', () => {
        it('solo: should call the right functions', async () => {
            const sessionId = 123;
            const gameId = 'gameId';
            const isSolo = true;
            const data: StartSessionData = { gameId, isSolo };
            const startTimerSpy = jest.spyOn(gateway, 'startClassicSessionTimer').mockImplementation(() => {});
            const createNewClassicSessionSpy = jest.spyOn(sessionService, 'createNewClassicSession').mockImplementation(() => {
                return sessionId;
            });
            const result = await gateway.startClassicSession(stubSocket, data);

            expect(logger.log).toHaveBeenCalledTimes(2);
            expect(createNewClassicSessionSpy).toHaveBeenCalledWith(gameId, stubSocket.id);
            expect(startTimerSpy).toHaveBeenCalledWith(stubSocket, sessionId);
            expect(result).toEqual(sessionId);
        });

        it('multi: should call the right functions', async () => {
            const sessionId = 123;
            const gameId = 'gameId';
            const isSolo = false;
            const data: StartSessionData = { gameId, isSolo };
            const startTimerSpy = jest.spyOn(gateway, 'startClassicSessionTimer').mockImplementation(() => {});
            const createNewClassicSessionSpy = jest.spyOn(sessionService, 'createNewClassicSession').mockImplementation(() => {
                return sessionId;
            });
            const result = await gateway.startClassicSession(stubSocket, data);
            jest.spyOn(server, 'allSockets').mockImplementation(async () => {
                return Promise.resolve(new Set([stubSocket.id, stubSocket.id]));
            });

            expect(logger.log).toHaveBeenCalledTimes(2);
            expect(createNewClassicSessionSpy).toHaveBeenCalledWith(gameId, stubSocket.id, secondStubSocket.id);
            expect(startTimerSpy).toHaveBeenCalledWith(stubSocket, sessionId);
            expect(result).toBeUndefined();
        });
        it('limited solo: should call the right functions', async () => {
            const sessionId = 123;
            const gameId = 'gameId';
            const isSolo = true;
            const limitedTimeSessionStub = { id: sessionId } as Session;
            const startTimerSpy = jest.spyOn(gateway, 'startLimitedTimeSessionTimer').mockImplementation(() => {});
            const createNewLimitedTimeSessionSpy = jest.spyOn(sessionService, 'createNewLimitedTimeSession').mockImplementation(() => {
                return sessionId;
            });
            jest.spyOn(server, 'allSockets').mockImplementation(async () => {
                return Promise.resolve(new Set([stubSocket.id, stubSocket.id]));
            });
            const sendNewGameSpy = jest.spyOn(gateway, 'sendNewGame').mockImplementation(async () => {});
            jest.spyOn(gateway, 'getSession').mockImplementation(() => {
                return limitedTimeSessionStub;
            });
            const result = await gateway.startLimitedTimeSession(stubSocket, isSolo);
            expect(logger.log).toHaveBeenCalledTimes(2);
            expect(createNewLimitedTimeSessionSpy).toHaveBeenCalledWith(stubSocket.id);
            expect(startTimerSpy).toHaveBeenCalledWith(stubSocket, sessionId);
            expect(sendNewGameSpy).toHaveBeenCalledWith(stubSocket, limitedTimeSessionStub);
        });
        it('limited multi: should call the right functions', async () => {
            const sessionId = 123;
            const gameId = 'gameId';
            const isSolo = false;
            const limitedTimeSessionStub = { id: sessionId } as Session;
            const startTimerSpy = jest.spyOn(gateway, 'startLimitedTimeSessionTimer').mockImplementation(() => {});
            const createNewLimitedTimeSessionSpy = jest.spyOn(sessionService, 'createNewLimitedTimeSession').mockImplementation(() => {
                return sessionId;
            });
            jest.spyOn(server, 'allSockets').mockImplementation(async () => {
                return Promise.resolve(new Set([stubSocket.id, stubSocket.id]));
            });
            const sendNewGameSpy = jest.spyOn(gateway, 'sendNewGame').mockImplementation(async () => {});
            jest.spyOn(gateway, 'getSession').mockImplementation(() => {
                return limitedTimeSessionStub;
            });
            const result = await gateway.startLimitedTimeSession(stubSocket, isSolo);
            expect(logger.log).toHaveBeenCalledTimes(2);
            expect(createNewLimitedTimeSessionSpy).toHaveBeenCalledWith(stubSocket.id, 'second-socket-id');
            expect(startTimerSpy).toHaveBeenCalledWith(stubSocket, sessionId);
            expect(sendNewGameSpy).toHaveBeenCalledWith(stubSocket, limitedTimeSessionStub);
        });
    });

    describe('getGameRoom', () => {
        it('returns socket gameRoom', () => {
            const roomId = 'gameRoom1';
            const stubSocketWithRooms: Socket = { id: '122', rooms: new Set([roomId]) } as Socket;
            expect(gateway.getGameRoom(stubSocketWithRooms)).toEqual(roomId);
        });

        it('returns client id when socket has no game room', () => {
            const stubSocketWithoutRooms: Socket = { id: '122', rooms: new Set([]) } as Socket;
            expect(gateway.getGameRoom(stubSocketWithoutRooms)).toEqual(stubSocketWithoutRooms.id);
        });
    });

    describe('sendSystemMessage', () => {
        it('gets name and emits to room', () => {
            const stubName = 'stub-game';
            const getNameSpy = jest.spyOn(sessionService, 'getName').mockImplementation(() => stubName);
            jest.spyOn(gateway, 'getGameRoom').mockImplementation(() => stubSocket.rooms[0]);
            const stubSystemCode = 'stub-code';
            gateway.sendSystemMessage(stubSocket, stubSystemCode);

            expect(getNameSpy).toBeCalled();
            expect(serverTo).toBeCalledWith(stubSocket.rooms[0]);
            expect(serverEmitSpy).toBeCalledWith('systemMessageFromServer', { playerName: stubName, systemCode: stubSystemCode });
        });
    });

    it('handleDisconnect should call sessionService.delete if session exist', () => {
        const deleteSpy = jest.spyOn(sessionService, 'delete').mockImplementation(() => {});
        jest.spyOn(sessionService, 'findByClientId').mockReturnValue(stubSession);
        gateway.handleDisconnect(stubSocket);

        expect(deleteSpy).toBeCalledWith(stubSession.id, stubSocket.id);
    });

    it('handleDisconnect should not call sessionService.delete if session does not exist', () => {
        const deleteSpy = jest.spyOn(sessionService, 'delete').mockImplementation(() => {});
        jest.spyOn(sessionService, 'findByClientId').mockReturnValue(undefined);
        gateway.handleDisconnect(stubSocket);

        expect(deleteSpy).not.toBeCalled();
    });

    it('handleDisconnect should not call sessionService.delete if error occured', () => {
        const deleteSpy = jest.spyOn(sessionService, 'delete').mockImplementation(() => {});
        jest.spyOn(sessionService, 'findByClientId').mockImplementation(() => {
            throw new Error();
        });
        gateway.handleDisconnect(stubSocket);

        expect(deleteSpy).not.toBeCalled();
    });

    it('handleClueRequest', () => {
        const systemMessageSpy = jest.spyOn(gateway, 'sendSystemMessage').mockImplementation(() => {});
        const generateClueSpy = jest.spyOn(sessionService, 'generateClue').mockImplementation(() => {
            return { coordinates: [{ x: 123, y: 33 }], nbCluesLeft: 0 };
        });
        const response = gateway.handleClueRequest(stubSocket);
        expect(systemMessageSpy).toHaveBeenCalledWith(stubSocket, 'useClue');
        expect(generateClueSpy).toHaveBeenCalledWith(stubSocket.id);
        expect(response).toEqual({ coordinates: [{ x: 123, y: 33 }], nbCluesLeft: 0 });
    });

    describe('sendNewGame', () => {
        let testSessionLimitedTime: LimitedTimeSession;
        // const gameEndedSpy = jest.spyOn(gateway, 'limitedTimeGameEnded').mockImplementation();
        it('should call the right functions when a game is chosen', async () => {
            testSessionLimitedTime = {
                nDifferencesFound: 2,
                decideNewGame() {},
            } as LimitedTimeSession;
            const gameStub: Game = { id: 'game-id' } as Game;
            const decideNewGameSpy = jest.spyOn(LimitedTimeSession.prototype, 'decideNewGame').mockImplementation(async () => {
                return gameStub;
            });
            const clientEmitSpy = jest.spyOn(stubSocket, 'emit');
            await gateway.sendNewGame(stubSocket, testSessionLimitedTime);
            expect(decideNewGameSpy).not.toHaveBeenCalled();
        });
        it('should call the right functions when a game is undefined', async () => {
            testSessionLimitedTime = {
                nDifferencesFound: 2,
                decideNewGame() {},
            } as LimitedTimeSession;
            const gameStub: Game = { id: 'game-id' } as Game;
            const decideNewGameSpy = jest.spyOn(LimitedTimeSession.prototype, 'decideNewGame').mockImplementation(async () => {
                return undefined;
            });
            const clientEmitSpy = jest.spyOn(stubSocket, 'emit');
            await gateway.sendNewGame(stubSocket, testSessionLimitedTime);
            expect(decideNewGameSpy).not.toHaveBeenCalled();
        });
    });
});
