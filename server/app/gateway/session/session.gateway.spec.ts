/* eslint-disable @typescript-eslint/no-explicit-any -- need to use any to spy on private method */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { GameService } from '@app/services/game/game.service';
import { Session } from '@app/services/session/session';
import { SessionService } from '@app/services/session/session.service';
import { StartSessionData } from '@common/askSessionIdData';
import { Coordinate } from '@common/coordinate';
import { GuessResult } from '@common/guess-result';
import { NewScore } from '@common/new-score';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import { BroadcastOperator, Server, Socket } from 'socket.io';
import { SessionGateway } from './session.gateway';
import { SessionEvents } from './session.gateway.events';
describe('SessionGateway', () => {
    let gateway: SessionGateway;
    let logger: SinonStubbedInstance<Logger>;
    // eslint-disable-next-line no-unused-vars
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;
    let sessionService: SinonStubbedInstance<SessionService>;
    let gameService: SinonStubbedInstance<GameService>;
    let session: SinonStubbedInstance<Session>;

    beforeEach(async () => {
        logger = createStubInstance(Logger);
        socket = createStubInstance<Socket>(Socket);
        server = createStubInstance<Server>(Server);
        sessionService = createStubInstance<SessionService>(SessionService);
        gameService = createStubInstance<GameService>(GameService);
        session = createStubInstance<Session>(Session);
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

    describe('askForSessionId', () => {
        const sessionCreatedId = 123;
        const gameId = '233';
        let isSolo: boolean;
        let askSessionIdData: StartSessionData;
        it('should return sessionId and call sessionService.createNewSession when solo game', () => {
            isSolo = true;
            askSessionIdData = { gameId, isSolo };
            jest.spyOn(sessionService, 'createNewSession').mockReturnValue(sessionCreatedId);
            expect(gateway.askForSessionId(socket, askSessionIdData)).toEqual(sessionCreatedId);
            expect(sessionService.createNewSession).toHaveBeenLastCalledWith(gameId, socket.id);
            expect(logger.log).toHaveBeenCalledWith(`Client ${socket.id} asked for session id`);
            expect(logger.log).toHaveBeenCalledWith(`solo session ${sessionCreatedId} was created by ${socket.id}`);
        });
        it('should call log.logger with the right messages when solo game', () => {
            isSolo = true;
            askSessionIdData = { gameId, isSolo };
            expect(gateway.askForSessionId(socket, askSessionIdData));
            expect(logger.log).toHaveBeenCalledWith(`Client ${socket.id} asked for session id`);
            expect(logger.log).toHaveBeenCalledWith(`solo session ${sessionCreatedId} was created by ${socket.id}`);
        });

        it('should call the right functions when multiplayer game', () => {
            const roomId = 'gameRoom-123-asdgdfgds';
            const otherSocket = createStubInstance<Socket>(Socket);
            jest.spyOn(sessionService, 'createNewSession').mockReturnValue(sessionCreatedId);
            jest.spyOn(gateway, 'startSessionTimer').mockImplementation();
            jest.spyOn(gateway['server'], 'emit').mockImplementation();
            jest.spyOn(logger, 'log').mockImplementation();

            jest.spyOn(gateway['server'], 'in').mockReturnValue({
                emit: (event: string) => {
                    expect(event).toEqual(123);
                },
            } as BroadcastOperator<unknown, unknown>);
            jest.spyOn(gateway['server'], 'allSockets').mockImplementation(async () => {
                return new Set([socket.id, otherSocket.id]);
            });
            expect(gateway.askForSessionId(socket, askSessionIdData)).toEqual(undefined);
            expect(sessionService.createNewSession).toHaveBeenLastCalledWith(gameId, socket.id, otherSocket.id);
            expect(gateway['server'].to(roomId).emit).toHaveBeenCalledWith('sessionId', sessionCreatedId);
            expect(gateway.startSessionTimer).toHaveBeenCalledWith(socket, 123);
        });
    });

    describe('leaveRoom', () => {
        it('should make the client leave the room', () => {
            const gameId = '123';
            const roomId = `gameRoom-roomId-${gameId}-ASJndsajs`;
            socket.join(roomId);
            // socketIOClient.mockReturnValue(socket);
            gateway.leaveRoom(socket);
            expect(socket.leave).toHaveBeenCalledWith(roomId);
        });
    });

    describe('handleCoordinatesSubmission for solo games', () => {
        it('should call the right functions and return the guess result when no winner and guessResult.isCorrect is not correct', () => {
            const sessionId = 123;
            const data: [number, Coordinate] = [sessionId, { x: -1, y: -1 }];
            const gameId = '123';
            const sessionStub: Session = new Session(gameId, socket.id);
            const guessResultStub: GuessResult = { isCorrect: false, differencesByPlayer: [], differencePixelList: [] };
            const newScoreStub: NewScore = { guessResult: guessResultStub, gameWonBy: 'No winner' };

            jest.spyOn(sessionService, 'findById').mockReturnValue(sessionStub);
            jest.spyOn(sessionStub, 'tryGuess').mockReturnValue(newScoreStub);
            jest.spyOn(gateway, 'notifyPlayersOfDiffFound').mockImplementation();
            jest.spyOn(socket, 'emit').mockImplementation();
            jest.spyOn(sessionStub, 'isSolo', 'get').mockReturnValue(true);

            expect(gateway.handleCoordinatesSubmission(socket, data)).toEqual(newScoreStub.guessResult);
            expect(sessionService.findBySessionId).toHaveBeenCalledWith(data[0]);
            expect(sessionStub.tryGuess).toHaveBeenCalledWith(data[0], socket.id);
            expect(gateway.notifyPlayersOfDiffFound).not.toHaveBeenCalledWith(socket, newScoreStub.guessResult);
            expect(gateway.playerWon).not.toHaveBeenCalled();
            expect(socket.emit).toHaveBeenCalledWith(SessionEvents.DifferenceFound, newScoreStub.guessResult);
        });

        it('should call the right functions and return the guess result when no winner and guessResult.isCorrect is correct', () => {
            const sessionId = 123;
            const data: [number, Coordinate] = [sessionId, { x: -1, y: -1 }];
            const gameId = '123';
            const sessionStub: Session = new Session(gameId, socket.id);
            const guessResultStub: GuessResult = { isCorrect: true, differencesByPlayer: [], differencePixelList: [] };
            const newScoreStub: NewScore = { guessResult: guessResultStub, gameWonBy: 'No winner' };

            jest.spyOn(sessionService, 'findById').mockReturnValue(sessionStub);
            jest.spyOn(sessionStub, 'tryGuess').mockReturnValue(newScoreStub);
            jest.spyOn(gateway, 'notifyPlayersOfDiffFound').mockImplementation();
            jest.spyOn(socket, 'emit').mockImplementation();
            jest.spyOn(sessionStub, 'isSolo', 'get').mockReturnValue(true);

            expect(gateway.handleCoordinatesSubmission(socket, data)).toEqual(newScoreStub.guessResult);
            expect(sessionService.findBySessionId).toHaveBeenCalledWith(data[0]);
            expect(sessionStub.tryGuess).toHaveBeenCalledWith(data[0], socket.id);
            expect(gateway.notifyPlayersOfDiffFound).toHaveBeenCalledWith(socket, newScoreStub.guessResult);
            expect(gateway.playerWon).not.toHaveBeenCalled();
            expect(socket.emit).not.toHaveBeenCalled();
        });

        it('should call the right functions and return the guess result when there is a winner and the guessResult.isCorrect is correct', () => {
            const sessionId = 123;
            const data: [number, Coordinate] = [sessionId, { x: -1, y: -1 }];
            const gameId = '123';
            const sessionStub: Session = new Session(gameId, socket.id);
            const guessResultStub: GuessResult = { isCorrect: true, differencesByPlayer: [], differencePixelList: [] };
            const newScoreStub: NewScore = { guessResult: guessResultStub, gameWonBy: 'No winner' };

            jest.spyOn(sessionService, 'findById').mockReturnValue(sessionStub);
            jest.spyOn(sessionStub, 'tryGuess').mockReturnValue(newScoreStub);
            jest.spyOn(gateway, 'notifyPlayersOfDiffFound').mockImplementation();
            jest.spyOn(socket, 'emit').mockImplementation();
            jest.spyOn(sessionStub, 'isSolo', 'get').mockReturnValue(true);

            expect(gateway.handleCoordinatesSubmission(socket, data)).toEqual(newScoreStub.guessResult);
            expect(sessionService.findBySessionId).toHaveBeenCalledWith(data[0]);
            expect(sessionStub.tryGuess).toHaveBeenCalledWith(data[0], socket.id);
            expect(gateway.notifyPlayersOfDiffFound).toHaveBeenCalledWith(socket, newScoreStub.guessResult);
            expect(gateway.playerWon).toHaveBeenCalledWith(socket, newScoreStub.gameWonBy, true);
            expect(socket.emit).not.toHaveBeenCalled();
        });
    });

    describe('handleCoordinatesSubmission for multi games', () => {
        const sessionId = 123;
        const data: [number, Coordinate] = [sessionId, { x: -1, y: -1 }];
        const gameId = '123';
        const sessionStub: Session = new Session(gameId, socket.id);
        const guessResultStub: GuessResult = { isCorrect: true, differencesByPlayer: [], differencePixelList: [] };
        const newScoreStub: NewScore = { guessResult: guessResultStub, gameWonBy: socket.id };
        it('should call the right functions and not return the guess result when no winner and guessResult.isCorrect is not correct', () => {
            jest.spyOn(sessionService, 'findById').mockReturnValue(sessionStub);
            jest.spyOn(sessionStub, 'tryGuess').mockReturnValue(newScoreStub);
            jest.spyOn(gateway, 'notifyPlayersOfDiffFound').mockImplementation();
            jest.spyOn(socket, 'emit').mockImplementation();
            jest.spyOn(sessionStub, 'isSolo', 'get').mockReturnValue(false);

            expect(gateway.handleCoordinatesSubmission(socket, data)).toEqual(newScoreStub.guessResult);
            expect(sessionService.findBySessionId).toHaveBeenCalledWith(data[0]);
            expect(sessionStub.tryGuess).toHaveBeenCalledWith(data[0], socket.id);
            expect(gateway.notifyPlayersOfDiffFound).not.toHaveBeenCalledWith(socket, newScoreStub.guessResult);
            // expect(gateway.playerWon).not.toHaveBeenCalledWith(socket, newScoreStub.gameWonBy, true);
            expect(gateway.playerWon).not.toHaveBeenCalled();
            expect(socket.emit).toHaveBeenCalledWith(SessionEvents.DifferenceFound, newScoreStub.guessResult);
        });

        it('should call the right functions and return the guess result when no winner and guessResult.isCorrect is correct', () => {
            jest.spyOn(sessionService, 'findById').mockReturnValue(sessionStub);
            jest.spyOn(sessionStub, 'tryGuess').mockReturnValue(newScoreStub);
            jest.spyOn(gateway, 'notifyPlayersOfDiffFound').mockImplementation();
            jest.spyOn(socket, 'emit').mockImplementation();
            jest.spyOn(sessionStub, 'isSolo', 'get').mockReturnValue(false);

            expect(gateway.handleCoordinatesSubmission(socket, data)).toEqual(newScoreStub.guessResult);
            expect(sessionService.findBySessionId).toHaveBeenCalledWith(data[0]);
            expect(sessionStub.tryGuess).toHaveBeenCalledWith(data[0], socket.id);
            expect(gateway.notifyPlayersOfDiffFound).toHaveBeenCalledWith(socket, newScoreStub.guessResult);
            // expect(gateway.playerWon).not.toHaveBeenCalledWith(socket, newScoreStub.gameWonBy, true);
            expect(gateway.playerWon).not.toHaveBeenCalled();
            expect(socket.emit).not.toHaveBeenCalled();
        });

        it('should call the right functions and return the guess result when there is a winner and the guessResult.isCorrect is correct', () => {
            jest.spyOn(sessionService, 'findById').mockReturnValue(sessionStub);
            jest.spyOn(sessionStub, 'tryGuess').mockReturnValue(newScoreStub);
            jest.spyOn(gateway, 'notifyPlayersOfDiffFound').mockImplementation();
            jest.spyOn(socket, 'emit').mockImplementation();
            jest.spyOn(sessionStub, 'isSolo', 'get').mockReturnValue(false);

            expect(gateway.handleCoordinatesSubmission(socket, data)).toEqual(newScoreStub.guessResult);
            expect(sessionService.findBySessionId).toHaveBeenCalledWith(data[0]);
            expect(sessionStub.tryGuess).toHaveBeenCalledWith(data[0], socket.id);
            expect(gateway.notifyPlayersOfDiffFound).toHaveBeenCalledWith(socket, newScoreStub.guessResult);
            expect(gateway.playerWon).toHaveBeenCalledWith(socket, newScoreStub.gameWonBy, false);
            expect(socket.emit).not.toHaveBeenCalled();
        });
    });

    describe('playerLeft', () => {
        const sessionId = 123;
        const data: [number, Coordinate] = [sessionId, { x: -1, y: -1 }];
        const gameId = '123';
        const sessionStub: Session = new Session(gameId, socket.id);
        const guessResultStub: GuessResult = { isCorrect: true, differencesByPlayer: [], differencePixelList: [] };
        const newScoreStub: NewScore = { guessResult: guessResultStub, gameWonBy: socket.id };
        const roomId = 'gameRoom-asddss-asdd';
        it('should call the right functions when session and room exist', () => {
            jest.spyOn(gateway['server'], 'in').mockReturnValue({
                emit: (event: string) => {
                    expect(event).toEqual(123);
                },
            } as BroadcastOperator<unknown, unknown>);
            socket.join('roomId');
            jest.spyOn(gateway['server'], 'emit').mockImplementation();
            jest.spyOn(gateway['server'], 'socketsLeave').getMockImplementation();
        });
    });
    //     describe('get', () => {
    //         it('serverRooms should return the rooms of the server', () => {
    //             const roomsStub = new Map([['roomId', new Set([socket.id])]]);
    //             stub(gateway as any, 'server').value({ sockets: { adapter: { rooms: roomsStub } } });
    //             expect(gateway.serverRooms).toEqual(roomsStub);
    //         });

    //         it('connectedClients should return the sockets of the server', () => {
    //             const socketsStub = new Map([['socketId', socket]]);
    //             stub(gateway as any, 'server').value({ sockets: { sockets: socketsStub } });
    //             expect(gateway.connectedClients).toEqual(socketsStub);
    //         });
    //     });

    //     describe('startMatchmaking', () => {
    //         it('startMatchMaking should create a room with the gameId and the date in the name', () => {
    //             jest.spyOn(Date, 'now').mockImplementation(() => {
    //                 return 123456789;
    //             });
    //             const expectedRoomId = `gameRoom-${1}-${123456789}`;
    //             gateway.startMatchmaking(socket, 1);
    //             expect(socket.join.calledWith(expectedRoomId)).toBeTruthy();
    //         });

    //         it('startMatchmaking should add the room to waitingRooms', () => {
    //             const pushSpy = jest.spyOn(gateway['waitingRooms'], 'push');
    //             expect(gateway['waitingRooms']).toHaveLength(0);
    //             gateway.startMatchmaking(socket, 1);
    //             expect(pushSpy).toHaveBeenCalled();
    //             expect(gateway['waitingRooms']).toHaveLength(1);
    //         });
    //     });

    //     describe('isSomeOneWaiting', () => {
    //         it('isSomeOneWaiting should call filterRoomsByGameId and return true if there is a room for a gameId in waitingRooms', () => {
    //             const roomId = 123;
    //             jest.spyOn(MatchmakingGateway.prototype as any, 'filterRoomsByGameId').mockReturnValue([[roomId, 'roomName']]);

    //             gateway['waitingRooms'].push([roomId, 'roomName']);
    //             expect(gateway.isSomeOneWaiting(socket, roomId)).toBeTruthy();
    //             expect(gateway['filterRoomsByGameId']).toHaveBeenCalled();
    //         });

    //         it('isSomeOneWaiting should call filterRoomsByGameId and return false if there is no room for a gameId in waitingRooms', () => {
    //             const roomId = 123;
    //             jest.spyOn(MatchmakingGateway.prototype as any, 'filterRoomsByGameId').mockReturnValue([]);

    //             gateway['waitingRooms'].push([124, 'roomName']);
    //             expect(gateway.isSomeOneWaiting(socket, roomId)).toBeFalsy();
    //             expect(gateway['filterRoomsByGameId']).toHaveBeenCalled();
    //         });
    //     });

    //     describe('leaveWaitingRoom', () => {
    //         it('leaveWaitingRoom should call removeThisRooms if the client was alone', () => {
    //             const roomId = 'gameRoom-124-123456789';
    //             gateway['waitingRooms'].push([124, roomId]);
    //             jest.spyOn(MatchmakingGateway.prototype as any, 'removeThisRooms').mockReturnValue([]);

    //             stub(socket, 'rooms').value(new Set([roomId]));
    //             stub(gateway, 'serverRooms').value(new Map([[roomId, new Set([''])]]));

    //             expect(gateway['waitingRooms']).toHaveLength(1);
    //             gateway.leaveWaitingRoom(socket, 124);
    //             expect(gateway['waitingRooms']).toHaveLength(0);
    //             expect(socket.leave.calledWith(roomId)).toBeTruthy();
    //         });

    //         it('should add the room to waitingRooms if was not alone and send opponentLeft to the other client', () => {
    //             const roomId = 'gameRoom-124-123456789';
    //             socket.join(roomId);
    //             stub(socket, 'rooms').value(new Set([roomId]));
    //             stub(gateway, 'serverRooms').value(new Map([[roomId, new Set(['1', '2'])]])); // 2 clients in the room

    //             socket.to.returns({
    //                 emit: (event: string) => {
    //                     expect(event).toEqual(MatchMakingEvents.OpponentLeft);
    //                 },
    //             } as BroadcastOperator<unknown, unknown>);

    //             expect(gateway['waitingRooms']).toHaveLength(0);
    //             gateway.leaveWaitingRoom(socket, 124);
    //             expect(gateway['waitingRooms']).toHaveLength(1);
    //             expect(socket.leave.calledWith(roomId)).toBeTruthy();
    //             expect(socket.to.calledWith(roomId)).toBeTruthy();
    //         });

    //         it('should do nothing if the room don`t start with gameRoom', () => {
    //             const roomId = 'gameRoom-124-123456789';
    //             gateway['waitingRooms'].push([124, roomId]);
    //             stub(socket, 'rooms').value(new Set(['roomName']));
    //             stub(gateway, 'serverRooms').value(new Map([[roomId, new Set(['1', '2'])]])); // 2 clients in the room
    //             const startWithSpy = jest.spyOn(String.prototype, 'startsWith');

    //             expect(gateway['waitingRooms']).toHaveLength(1);
    //             gateway.leaveWaitingRoom(socket, 124);
    //             expect(gateway['waitingRooms']).toHaveLength(1);
    //             expect(socket.leave.calledWith(roomId)).toBeFalsy();
    //             expect(startWithSpy).toHaveBeenCalled();
    //         });
    //     });

    //     describe('joinRoom', () => {
    //         it('should call filterRoomsByGameId and do nothing if returned array is empty', () => {
    //             jest.spyOn(MatchmakingGateway.prototype as any, 'filterRoomsByGameId').mockReturnValue([]);
    //             gateway.joinRoom(socket, { gameId: 0, playerName: '' });
    //             expect(gateway['filterRoomsByGameId']).toHaveBeenCalled();
    //             expect(socket.join.called).toBeFalsy();
    //         });

    //         it('should call socket.join and send "opponentJoined" and removeThisRooms if the returned array is not empty', () => {
    //             jest.spyOn(MatchmakingGateway.prototype as any, 'filterRoomsByGameId').mockReturnValue([['gameRoom-124-123456789', 124]]);
    //             socket.to.returns({
    //                 emit: (event: string, playerName: string) => {
    //                     expect(event).toEqual(MatchMakingEvents.OpponentJoined);
    //                     expect(playerName).toEqual('test');
    //                 },
    //             } as BroadcastOperator<unknown, unknown>);
    //             jest.spyOn(MatchmakingGateway.prototype as any, 'removeThisRooms').mockReturnValue([]);

    //             gateway.joinRoom(socket, { gameId: 0, playerName: 'test' });
    //             expect(gateway['filterRoomsByGameId']).toHaveBeenCalled();
    //             expect(socket.join.called).toBeTruthy();
    //             expect(socket.to.called).toBeTruthy();
    //             expect(gateway['removeThisRooms']).toHaveBeenCalled();
    //             expect(gateway['waitingRooms']).toHaveLength(0);
    //         });
    //     });

    //     describe('acceptOpponent', () => {
    //         it('should do nothing if the room don`t start with gameRoom and return false', () => {
    //             stub(socket, 'rooms').value(new Set(['roomName']));
    //             const startWithSpy = jest.spyOn(String.prototype, 'startsWith');

    //             const result = gateway.acceptOpponent(socket, 'name');
    //             expect(startWithSpy).toHaveBeenCalled();
    //             expect(result).toBeFalsy();
    //         });

    //         it('should send "acceptOtherPlayer" and return true if the AcceptedPlayer is still in the room', () => {
    //             const roomId = 'gameRoom-124-123456789';
    //             stub(socket, 'rooms').value(new Set([roomId]));
    //             stub(gateway, 'serverRooms').value(new Map([[roomId, new Set(['1', '2'])]])); // 2 clients in the room

    //             socket.to.returns({
    //                 emit: (event: string, playerName: string) => {
    //                     expect(event).toEqual(MatchMakingEvents.AcceptOtherPlayer);
    //                     expect(playerName).toEqual('name');
    //                 },
    //             } as BroadcastOperator<unknown, unknown>);

    //             const result = gateway.acceptOpponent(socket, 'name');
    //             expect(socket.to.calledWith(roomId)).toBeTruthy();
    //             expect(result).toBeTruthy();
    //         });

    //         it('should not send "acceptOtherPlayer" and return false if the AcceptedPlayer left the room', () => {
    //             const roomId = 'gameRoom-124-123456789';
    //             stub(socket, 'rooms').value(new Set([roomId]));
    //             stub(gateway, 'serverRooms').value(new Map([[roomId, new Set(['1'])]])); // 1 client in the room

    //             const result = gateway.acceptOpponent(socket, 'name');
    //             expect(socket.to.calledWith(roomId)).toBeFalsy();
    //             expect(result).toBeFalsy();
    //         });
    //     });

    //     describe('rejectOpponent', () => {
    //         it('should do nothing if the room don`t start with gameRoom', () => {
    //             stub(socket, 'rooms').value(new Set(['roomName']));
    //             const startWithSpy = jest.spyOn(String.prototype, 'startsWith');
    //             const removeOtherPlayerSpy = jest.spyOn(MatchmakingGateway.prototype as any, 'removeOtherPlayer');

    //             gateway.rejectOpponent(socket, { gameId: 124, playerName: 'name' });
    //             expect(startWithSpy).toHaveBeenCalled();
    //             expect(socket.to.called).toBeFalsy();
    //             expect(removeOtherPlayerSpy).not.toHaveBeenCalled();
    //         });

    //         it('should send "rejectOtherPlayer" and put back the room in the waitingRoom array if room is valid', () => {
    //             const roomId = 'gameRoom-124-123456789';
    //             stub(socket, 'rooms').value(new Set([roomId]));
    //             stub(gateway, 'serverRooms').value(new Map([[roomId, new Set(['1', '2'])]])); // 2 clients in the room

    //             jest.spyOn(MatchmakingGateway.prototype as any, 'removeOtherPlayer').mockImplementation((client: Socket, clientRoomId: string) => {
    //                 expect(clientRoomId).toEqual(roomId);
    //                 expect(client).toEqual(socket);
    //             });

    //             socket.to.returns({
    //                 emit: (event: string, playerName: string) => {
    //                     expect(event).toEqual(MatchMakingEvents.RejectOtherPlayer);
    //                     expect(playerName).toEqual('name');
    //                 },
    //             } as BroadcastOperator<unknown, unknown>);

    //             expect(gateway['waitingRooms']).toHaveLength(0);
    //             gateway.rejectOpponent(socket, { gameId: 124, playerName: 'name' });
    //             expect(gateway['waitingRooms']).toHaveLength(1);
    //             expect(socket.to.calledWith(roomId)).toBeTruthy();
    //             expect(gateway['removeOtherPlayer']).toHaveBeenCalled();
    //         });
    //     });

    //     it('afterInit should log "Matchmaking gateway initialized"', () => {
    //         gateway.afterInit();
    //         expect(logger.log.calledWith('Matchmaking gateway initialized')).toBeTruthy();
    //     });

    //     describe('removeOtherPlayer', () => {
    //         it('should remove the other player from the room', () => {
    //             const roomId = 'gameRoom-124-123456789';
    //             const otherClient = createStubInstance<Socket>(Socket);

    //             socket.join(roomId);
    //             otherClient.join(roomId);

    //             stub(gateway, 'connectedClients').value(
    //                 new Map([
    //                     ['1', socket],
    //                     ['2', otherClient],
    //                 ]),
    //             );
    //             stub(gateway, 'serverRooms').value(new Map([[roomId, new Set(['1', '2'])]])); // 2 clients id

    //             gateway['removeOtherPlayer'](socket, roomId);

    //             expect(otherClient.leave.calledWith(roomId)).toBeTruthy();
    //         });
    //     });

    //     describe('notWaitingRoom', () => {
    //         it('should return true if the room is not in the waitingRoom array', () => {
    //             const roomId = 'gameRoom-124-123456789';
    //             stub(gateway, 'serverRooms').value(new Map([[roomId, new Set(['1', '2'])]])); // 2 clients in the room
    //             expect(gateway['notWaitingRoom'](roomId)).toBeTruthy();
    //         });

    //         it('should return false if the room is in the waitingRoom array', () => {
    //             const roomId = 'gameRoom-124-123456789';
    //             stub(gateway, 'serverRooms').value(new Map([[roomId, new Set(['1', '2'])]])); // 2 clients in the room
    //             gateway['waitingRooms'].push([124, roomId]);
    //             expect(gateway['notWaitingRoom'](roomId)).toBeFalsy();
    //         });
    //     });

    //     it('removeThisRooms should return an array of room without the room that match roomId', () => {
    //         const roomId = 'gameRoom-124-123456789';
    //         gateway['waitingRooms'].push([124, roomId]);
    //         expect(gateway['waitingRooms']).toHaveLength(1);
    //         const resultArray = gateway['removeThisRooms'](roomId);
    //         expect(resultArray).toHaveLength(0);
    //     });

    //     it('filterRoomsByGameId should return an array of room that match gameId', () => {
    //         const roomId = 'gameRoom-124-123456789';
    //         gateway['waitingRooms'].push([124, roomId]);
    //         gateway['waitingRooms'].push([125, roomId]);
    //         const resultArray = gateway['filterRoomsByGameId'](124);
    //         expect(resultArray).toHaveLength(1);
    //         expect(resultArray).toEqual([[124, roomId]]);
    //     });
});
