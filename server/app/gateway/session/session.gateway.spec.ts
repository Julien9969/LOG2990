/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any -- need to use any to spy on private method */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { DifferenceValidationService } from '@app/services/difference-validation/difference-validation.service';
import { GameService } from '@app/services/game/game.service';
import { Session } from '@app/services/session/session';
import { SessionService } from '@app/services/session/session.service';
import { Coordinate } from '@common/coordinate';
import { GuessResult } from '@common/guess-result';
import { SessionEvents } from '@common/session.gateway.events';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import { BroadcastOperator, Server, Socket } from 'socket.io';
import { SessionGateway } from './session.gateway';
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
        logger = createStubInstance<Logger>(Logger);
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

    // describe('askForSessionId', () => {
    //     const sessionCreatedId = 123;
    //     const gameId = '233';
    //     let isSolo: boolean;
    //     let askSessionIdData: StartSessionData;
    //     it('should return sessionId and call sessionService.createNewSession when solo game', () => {
    //         isSolo = true;
    //         askSessionIdData = { gameId, isSolo };
    //         jest.spyOn(sessionService, 'createNewSession').mockReturnValue(sessionCreatedId);
    //         expect(gateway.askForSessionId(socket, askSessionIdData)).toEqual(sessionCreatedId);
    //         expect(sessionService.createNewSession).toHaveBeenLastCalledWith(gameId, socket.id);
    //         expect(logger.log).toHaveBeenCalledWith(`Client ${socket.id} asked for session id`);
    //         expect(logger.log).toHaveBeenCalledWith(`solo session ${sessionCreatedId} was created by ${socket.id}`);
    //     });
    //     it('should call log.logger with the right messages when solo game', () => {
    //         isSolo = true;
    //         askSessionIdData = { gameId, isSolo };
    //         expect(gateway.askForSessionId(socket, askSessionIdData));
    //         expect(logger.log).toHaveBeenCalledWith(`Client ${socket.id} asked for session id`);
    //         expect(logger.log).toHaveBeenCalledWith(`solo session ${sessionCreatedId} was created by ${socket.id}`);
    //     });

    //     it('should call the right functions when multiplayer game', () => {
    //         const roomId = 'gameRoom-123-asdgdfgds';
    //         const otherSocket = createStubInstance<Socket>(Socket);
    //         jest.spyOn(sessionService, 'createNewSession').mockReturnValue(sessionCreatedId);
    //         jest.spyOn(gateway, 'startSessionTimer').mockImplementation();
    //         jest.spyOn(gateway['server'], 'emit').mockImplementation();
    //         jest.spyOn(logger, 'log').mockImplementation();

    //         jest.spyOn(gateway['server'], 'in').mockReturnValue({
    //             emit: (event: string) => {
    //                 expect(event).toEqual(123);
    //             },
    //         } as BroadcastOperator<unknown, unknown>);
    //         jest.spyOn(gateway['server'], 'allSockets').mockImplementation(async () => {
    //             return new Set([socket.id, otherSocket.id]);
    //         });
    //         expect(gateway.askForSessionId(socket, askSessionIdData)).toEqual(undefined);
    //         expect(sessionService.createNewSession).toHaveBeenLastCalledWith(gameId, socket.id, otherSocket.id);
    //         expect(gateway['server'].to(roomId).emit).toHaveBeenCalledWith('sessionId', sessionCreatedId);
    //         expect(gateway.startSessionTimer).toHaveBeenCalledWith(socket, 123);
    //     });
    // });

    describe('leaveRoom', () => {
        it('should make the client leave the room', () => {
            const gameId = '123';
            const roomId = `gameRoom-roomId-${gameId}-ASJndsajs`;
            const socketStub: any = { id: '122' };
            // socket.join(roomId);
            // socketIOClient.mockReturnValue(socket);
            gateway.leaveRoom(socketStub);
            expect(socketStub.leave).toHaveBeenCalledWith(roomId);
        });
    });

    describe('handleCoordinatesSubmission for solo games', () => {
        it('should call the right functions and return the guess result when no winner and guessResult.isCorrect is not correct', () => {
            const sessionId = 123;
            const data: [number, Coordinate] = [sessionId, { x: -1, y: -1 }];
            const gameId = '123';
            const sessionStub: Session = new Session(gameId, socket.id);
            const guessResultStub: GuessResult = { isCorrect: false, differencesByPlayer: [], differencePixelList: [], winnerName: '' };

            jest.spyOn(sessionStub, 'tryGuess').mockReturnValue(guessResultStub);
            jest.spyOn(gateway, 'notifyPlayersOfDiffFound').mockImplementation();
            jest.spyOn(socket, 'emit').mockImplementation();
            jest.spyOn(sessionStub, 'isSolo', 'get').mockReturnValue(true);

            expect(gateway.handleCoordinatesSubmission(socket, data)).toEqual(guessResultStub);
            expect(sessionService.findBySessionId).toHaveBeenCalledWith(data[0]);
            expect(sessionStub.tryGuess).toHaveBeenCalledWith(data[0], socket.id);
            expect(gateway.notifyPlayersOfDiffFound).not.toHaveBeenCalledWith(socket, guessResultStub);
            expect(gateway.playerWon).not.toHaveBeenCalled();
            expect(socket.emit).toHaveBeenCalledWith(SessionEvents.DifferenceFound, guessResultStub);
        });

        it('should call the right functions and return the guess result when no winner and guessResult.isCorrect is correct', () => {
            const sessionId = 123;
            const data: [number, Coordinate] = [sessionId, { x: -1, y: -1 }];
            const gameId = '123';
            const sessionStub: Session = new Session(gameId, socket.id);
            const guessResultStub: GuessResult = { isCorrect: true, differencesByPlayer: [], differencePixelList: [], winnerName: '' };

            jest.spyOn(sessionStub, 'tryGuess').mockReturnValue(guessResultStub);
            jest.spyOn(gateway, 'notifyPlayersOfDiffFound').mockImplementation();
            jest.spyOn(socket, 'emit').mockImplementation();
            jest.spyOn(sessionStub, 'isSolo', 'get').mockReturnValue(true);

            expect(gateway.handleCoordinatesSubmission(socket, data)).toEqual(guessResultStub);
            expect(sessionService.findBySessionId).toHaveBeenCalledWith(data[0]);
            expect(sessionStub.tryGuess).toHaveBeenCalledWith(data[0], socket.id);
            expect(gateway.notifyPlayersOfDiffFound).toHaveBeenCalledWith(socket, guessResultStub);
            expect(gateway.playerWon).not.toHaveBeenCalled();
            expect(socket.emit).not.toHaveBeenCalled();
        });

        it('should call the right functions and return the guess result when there is a winner and the guessResult.isCorrect is correct', () => {
            const sessionId = 123;
            const data: [number, Coordinate] = [sessionId, { x: -1, y: -1 }];
            const gameId = '123';
            const sessionStub: Session = new Session(gameId, socket.id);
            const guessResultStub: GuessResult = { isCorrect: true, differencesByPlayer: [], differencePixelList: [], winnerName: '' };

            jest.spyOn(sessionStub, 'tryGuess').mockReturnValue(guessResultStub);
            jest.spyOn(gateway, 'notifyPlayersOfDiffFound').mockImplementation();
            jest.spyOn(socket, 'emit').mockImplementation();
            jest.spyOn(sessionStub, 'isSolo', 'get').mockReturnValue(true);

            expect(gateway.handleCoordinatesSubmission(socket, data)).toEqual(guessResultStub);
            expect(sessionService.findBySessionId).toHaveBeenCalledWith(data[0]);
            expect(sessionStub.tryGuess).toHaveBeenCalledWith(data[0], socket.id);
            expect(gateway.notifyPlayersOfDiffFound).toHaveBeenCalledWith(socket, guessResultStub);
            expect(gateway.playerWon).toHaveBeenCalledWith(socket, guessResultStub, true);
            expect(socket.emit).not.toHaveBeenCalled();
        });
    });

    describe('handleCoordinatesSubmission for multi games', () => {
        const sessionId = 123;
        const data: [number, Coordinate] = [sessionId, { x: -1, y: -1 }];
        const gameId = '123';
        const socketStub: any = { id: 'socketId' };
        jest.spyOn(DifferenceValidationService.prototype, 'loadDifferences').mockImplementation(() => {
            DifferenceValidationService.prototype.differenceCoordLists = [];
        });

        const sessionStub: Session = new Session(gameId, socketStub.id);
        const guessResultStub: GuessResult = { isCorrect: true, differencesByPlayer: [], differencePixelList: [], winnerName: '' };
        it('should call the right functions and not return the guess result when no winner and guessResult.isCorrect is not correct', () => {
            jest.spyOn(sessionStub, 'tryGuess').mockReturnValue(guessResultStub);
            jest.spyOn(gateway, 'notifyPlayersOfDiffFound').mockImplementation();
            jest.spyOn(socket, 'emit').mockImplementation();
            jest.spyOn(sessionStub, 'isSolo', 'get').mockReturnValue(false);

            expect(gateway.handleCoordinatesSubmission(socket, data)).toEqual(guessResultStub);
            expect(sessionService.findBySessionId).toHaveBeenCalledWith(data[0]);
            expect(sessionStub.tryGuess).toHaveBeenCalledWith(data[0], socket.id);
            expect(gateway.notifyPlayersOfDiffFound).not.toHaveBeenCalledWith(socket, guessResultStub);
            // expect(gateway.playerWon).not.toHaveBeenCalledWith(socket, newScoreStub.gameWonBy, true);
            expect(gateway.playerWon).not.toHaveBeenCalled();
            expect(socket.emit).toHaveBeenCalledWith(SessionEvents.DifferenceFound, guessResultStub);
        });

        it('should call the right functions and return the guess result when no winner and guessResult.isCorrect is correct', () => {
            jest.spyOn(sessionStub, 'tryGuess').mockReturnValue(guessResultStub);
            jest.spyOn(gateway, 'notifyPlayersOfDiffFound').mockImplementation();
            jest.spyOn(socket, 'emit').mockImplementation();
            jest.spyOn(sessionStub, 'isSolo', 'get').mockReturnValue(false);

            expect(gateway.handleCoordinatesSubmission(socket, data)).toEqual(guessResultStub);
            expect(sessionService.findBySessionId).toHaveBeenCalledWith(data[0]);
            expect(sessionStub.tryGuess).toHaveBeenCalledWith(data[0], socket.id);
            expect(gateway.notifyPlayersOfDiffFound).toHaveBeenCalledWith(socket, guessResultStub);
            // expect(gateway.playerWon).not.toHaveBeenCalledWith(socket, newScoreStub.gameWonBy, true);
            expect(gateway.playerWon).not.toHaveBeenCalled();
            expect(socket.emit).not.toHaveBeenCalled();
        });

        it('should call the right functions and return the guess result when there is a winner and the guessResult.isCorrect is correct', () => {
            jest.spyOn(sessionStub, 'tryGuess').mockReturnValue(guessResultStub);
            jest.spyOn(gateway, 'notifyPlayersOfDiffFound').mockImplementation();
            jest.spyOn(socket, 'emit').mockImplementation();
            jest.spyOn(sessionStub, 'isSolo', 'get').mockReturnValue(false);

            expect(gateway.handleCoordinatesSubmission(socket, data)).toEqual(guessResultStub);
            expect(sessionService.findBySessionId).toHaveBeenCalledWith(data[0]);
            expect(sessionStub.tryGuess).toHaveBeenCalledWith(data[0], socket.id);
            expect(gateway.notifyPlayersOfDiffFound).toHaveBeenCalledWith(socket, guessResultStub);
            expect(gateway.playerWon).toHaveBeenCalledWith(socket, guessResultStub, false);
            expect(socket.emit).not.toHaveBeenCalled();
        });
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

    describe('getAllActiveSessions', () => {
        it('should call sessionService.getAll', () => {
            jest.spyOn(sessionService, 'getAll').mockReturnValue([]);
            gateway.getAllActiveSession();
            expect(sessionService.getAll).toHaveBeenCalled();
        });
    });

    describe('getSessionById', () => {
        it('should call the sessionService function and return the value', () => {
            jest.spyOn(sessionService, 'findById').mockReturnValue(session);
            gateway.getSessionById(socket, 123);
            expect(sessionService.findById).toHaveBeenCalledWith(123);
        });
    });

    describe('deleteGame', () => {
        it('should call session.Service.delete and return the session Id', () => {
            jest.spyOn(sessionService, 'delete');
            expect(gateway.deleteGame(123)).toEqual(123);
            expect(sessionService.delete).toHaveBeenCalledWith(123);
        });
    });

    describe('askForSessionId', () => {
        const sessionCreatedId = 123;
        const gameId = '233';
        let isSolo: boolean;
        let askSessionIdData: AskSessionIdData;
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

        // it('should return sessionId and call sessionService.createNewSession when multiplayer game', () => {
        //     // const gameId = '233';à
        //     isSolo = false;
        //     askSessionIdData = { gameId, isSolo };
        //     jest.spyOn(gateway['server'], 'to').mockReturnValue({
        //         emit: (event: string) => {
        //             expect(event).toEqual('sessionId');
        //         },
        //     } as BroadcastOperator<unknown, unknown>);
        //     // const roomsStub = new Map([['roomId', new Set([socket.id, 'secondSocketId'])]]);
        //     const roomId = `gameRoom-roomId-${gameId}-ASJndsajs`;
        //     const otherClient = createStubInstance<Socket>(Socket);
        //     // jest.spyOn(server, 'in');
        //     // jest.spyOn(server, 'allSockets');
        //     jest.spyOn(server, 'emit').mockImplementation();
        //     stub(socket.rooms).value({ roomId });
        //     socket.join(roomId);
        //     console.log('socket.rooms:', socket.rooms);
        //     otherClient.join(roomId);
        //     jest.spyOn(sessionService, 'createNewSession').mockReturnValue(sessionCreatedId);
        //     expect(gateway.askForSessionId(socket, askSessionIdData)).toEqual(sessionCreatedId);
        //     expect(sessionService.createNewSession).toHaveBeenLastCalledWith(gameId, socket.id, otherClient.id);
        //     expect(gateway['server'].to(roomId).emit).toHaveBeenCalledWith('sessionId', sessionCreatedId);
        // });
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
            jest.spyOn(sessionStub, 'getNbPlayers').mockReturnValue(1);

            expect(gateway.handleCoordinatesSubmission(socket, data)).toEqual(newScoreStub.guessResult);
            expect(sessionService.findById).toHaveBeenCalledWith(data[0]);
            expect(sessionStub.tryGuess).toHaveBeenCalledWith(data[0], socket.id);
            expect(gateway.notifyPlayersOfDiffFound).not.toHaveBeenCalledWith(socket, newScoreStub.guessResult);
            expect(gateway.playerWon).not.toHaveBeenCalled();
            expect(socket.emit).toHaveBeenCalledWith('differenceFound', newScoreStub.guessResult);
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
            jest.spyOn(sessionStub, 'getNbPlayers').mockReturnValue(1);

            expect(gateway.handleCoordinatesSubmission(socket, data)).toEqual(newScoreStub.guessResult);
            expect(sessionService.findById).toHaveBeenCalledWith(data[0]);
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
            jest.spyOn(sessionStub, 'getNbPlayers').mockReturnValue(1);

            expect(gateway.handleCoordinatesSubmission(socket, data)).toEqual(newScoreStub.guessResult);
            expect(sessionService.findById).toHaveBeenCalledWith(data[0]);
            expect(sessionStub.tryGuess).toHaveBeenCalledWith(data[0], socket.id);
            expect(gateway.notifyPlayersOfDiffFound).toHaveBeenCalledWith(socket, newScoreStub.guessResult);
            expect(gateway.playerWon).toHaveBeenCalledWith(socket, newScoreStub.gameWonBy, true);
            expect(socket.emit).not.toHaveBeenCalled();
        });
    });

    describe('handleCoordinatesSubmission for multi games', () => {
        it('should call the right functions and not return the guess result when no winner and guessResult.isCorrect is not correct', () => {
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
            jest.spyOn(sessionStub, 'getNbPlayers').mockReturnValue(2);

            expect(gateway.handleCoordinatesSubmission(socket, data)).toEqual(newScoreStub.guessResult);
            expect(sessionService.findById).toHaveBeenCalledWith(data[0]);
            expect(sessionStub.tryGuess).toHaveBeenCalledWith(data[0], socket.id);
            expect(gateway.notifyPlayersOfDiffFound).not.toHaveBeenCalledWith(socket, newScoreStub.guessResult);
            // expect(gateway.playerWon).not.toHaveBeenCalledWith(socket, newScoreStub.gameWonBy, true);
            expect(gateway.playerWon).not.toHaveBeenCalled();
            expect(socket.emit).toHaveBeenCalledWith('differenceFound', newScoreStub.guessResult);
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
            jest.spyOn(sessionStub, 'getNbPlayers').mockReturnValue(2);

            expect(gateway.handleCoordinatesSubmission(socket, data)).toEqual(newScoreStub.guessResult);
            expect(sessionService.findById).toHaveBeenCalledWith(data[0]);
            expect(sessionStub.tryGuess).toHaveBeenCalledWith(data[0], socket.id);
            expect(gateway.notifyPlayersOfDiffFound).toHaveBeenCalledWith(socket, newScoreStub.guessResult);
            // expect(gateway.playerWon).not.toHaveBeenCalledWith(socket, newScoreStub.gameWonBy, true);
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
            jest.spyOn(sessionStub, 'getNbPlayers').mockReturnValue(2);

            expect(gateway.handleCoordinatesSubmission(socket, data)).toEqual(newScoreStub.guessResult);
            expect(sessionService.findById).toHaveBeenCalledWith(data[0]);
            expect(sessionStub.tryGuess).toHaveBeenCalledWith(data[0], socket.id);
            expect(gateway.notifyPlayersOfDiffFound).toHaveBeenCalledWith(socket, newScoreStub.guessResult);
            expect(gateway.playerWon).toHaveBeenCalledWith(socket, newScoreStub.gameWonBy, false);
            expect(socket.emit).not.toHaveBeenCalled();
        });
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
    describe('playerLeft', () => {
        const sessionId = 123;
        const roomId = 'gameRoom-asddss-asdd';
        // jest.spyOn(gateway['server'], 'in').mockReturnValue({
        //     emit: (event: string) => {
        //         expect(event).toEqual(123);
        //     },
        // } as BroadcastOperator<unknown, unknown>);
        jest.spyOn(gateway['server'], 'emit').mockImplementation();
        jest.spyOn(gateway['server'], 'socketsLeave').mockImplementation();
        jest.spyOn(sessionService, 'delete').mockImplementation();
        jest.spyOn(socket, 'disconnect').mockImplementation();

        it('should call the right functions when session and room exist and delete is successful', () => {
            socket.join(roomId);
            gateway.playerLeft(socket, sessionId);
            expect(gateway['server'].emit).toHaveBeenCalledWith(SessionEvents.OpponentLeftGame);
            expect(gateway['server'].socketsLeave).toHaveBeenCalledWith(roomId);
            expect(sessionService.delete).toHaveBeenCalledWith(sessionId);
            expect(socket.disconnect).toHaveBeenCalled();
        });

        it('should call the right functions when room exists and session doesnt', () => {
            socket.join(roomId);
            gateway.playerLeft(socket, sessionId);
            expect(gateway['server'].emit).toHaveBeenCalledWith(SessionEvents.OpponentLeftGame);
            expect(gateway['server'].socketsLeave).toHaveBeenCalledWith(roomId);
            expect(sessionService.delete).not.toHaveBeenCalledWith(sessionId);
            expect(gateway['logger'].log).toHaveBeenCalledWith(Error);
            expect(socket.disconnect).toHaveBeenCalled();
        });

        it('should call the right functions when room doesnt exist but the session does', () => {
            gateway.playerLeft(socket, sessionId);
            expect(gateway['server'].emit).not.toHaveBeenCalled();
            expect(gateway['server'].socketsLeave).not.toHaveBeenCalled();
            expect(sessionService.delete).toHaveBeenCalledWith(sessionId);
            expect(socket.disconnect).toHaveBeenCalled();
        });

        it('should call the right functions when room doesnt exist and neither does the session', () => {
            gateway.playerLeft(socket, sessionId);
            expect(gateway['server'].emit).not.toHaveBeenCalled();
            expect(gateway['server'].socketsLeave).not.toHaveBeenCalled();
            expect(sessionService.delete).not.toHaveBeenCalledWith(sessionId);
            expect(gateway['logger'].log).toHaveBeenCalledWith(Error);
            expect(socket.disconnect).toHaveBeenCalled();
        });
    });

    describe('startSessionTimer', () => {
        const sessionId = 123;
        const gameId = '123';
        const sessionStub: Session = new Session(gameId, socket.id);
        const roomId = 'gameRoom-asddss-asdd';

        jest.spyOn(socket, 'emit').mockImplementation();
        jest.spyOn(gateway['server'], 'emit').mockImplementation();
        it('should declare the right values when its a solo game', () => {
            jest.spyOn(sessionStub, 'isSolo', 'get').mockReturnValue(true);
            gateway.startSessionTimer(socket, sessionId);
            jest.useFakeTimers();
            jest.advanceTimersByTime(1000 * 5);
            expect(socket.emit).toBeCalledTimes(5);
            expect(setInterval).toHaveBeenLastCalledWith(() => {
                session.timeElapsed++;
                socket.emit(SessionEvents.TimerUpdate, session.formatedTimeElapsed);
            });
        });

        it('should declare the right values when its a multi game', () => {
            socket.join(roomId);
            jest.spyOn(sessionStub, 'isSolo', 'get').mockReturnValue(false);
            jest.useFakeTimers();
            jest.spyOn(gateway['server'], 'to').mockReturnValue({
                emit: (event: string) => {
                    expect(event).toEqual(123);
                },
            } as BroadcastOperator<unknown, unknown>);

            gateway.startSessionTimer(socket, sessionId);
            jest.advanceTimersByTime(1000 * 5);
            expect(socket.emit).toBeCalledTimes(5);
            expect(setInterval).toHaveBeenLastCalledWith(() => {
                session.timeElapsed++;
                gateway['server'].to(roomId).emit(SessionEvents.TimerUpdate, session.formatedTimeElapsed);
            });
        });
    });

    describe('notifyPlayersOfDiffFound', () => {
        const roomId = 'gameRoom-asddss-asdd';
        socket.join(roomId);
        const guessResultStub: GuessResult = { isCorrect: true, differencesByPlayer: [], differencePixelList: [], winnerName: '' };
        it('should emit the right message and data when roomId exists', () => {
            jest.spyOn(gateway['server'], 'emit').mockImplementation();
            gateway.notifyPlayersOfDiffFound(socket, guessResultStub);
            expect(gateway['server'].emit).toHaveBeenCalledWith(SessionEvents.DifferenceFound, guessResultStub);
        });
    });

    describe('playerWon', () => {
        const gameId = '123';
        const roomId = 'gameRoom-asddss-asdd';
        const sessionId = 123;
        const sessionStub: Session = new Session(gameId, socket.id);
        const timeElapsed = 2230; // 2230s elapsed in our false game
        session.timeElapsed = timeElapsed;
        const playerName = 'Player Name';
        jest.spyOn(session, 'stopTimer').mockImplementation();
        jest.spyOn(socket, 'emit').mockImplementation();
        // gateway['server'].emit('playerName', playerName);
        jest.spyOn(gateway['gameService'], 'addToScoreboard').mockImplementation();
        jest.spyOn(gateway['server'], 'emit').mockImplementation();
        jest.spyOn(gateway['server'], 'socketsLeave').mockImplementation();
        it('should emit to the right client when solo game', () => {
            const isSolo = true;
            gateway.playerWon(socket, sessionId, isSolo);
            gateway['server'].emit('playerName', playerName);
            expect(gateway['gameService'].addToScoreboard).toHaveBeenCalledWith(gameId, { winner: playerName, time: timeElapsed, solo: isSolo });
            expect(gateway['server'].emit).toHaveBeenCalledWith('playerWon', { name: playerName, socketId: socket.id });
        });

        it('should emit to the right clients when multi game', () => {
            const otherSocket = createStubInstance<Socket>(Socket);
            socket.join(roomId);
            otherSocket.join(roomId);
            const isSolo = false;
            gateway.playerWon(socket, sessionId, isSolo);
            gateway['server'].emit('playerName', playerName);
            expect(gateway['gameService'].addToScoreboard).toHaveBeenCalledWith(gameId, { winner: playerName, time: timeElapsed, solo: isSolo });
            expect(gateway['server'].emit).toHaveBeenCalledWith('playerWon', { name: playerName, socketId: socket.id });
        });
    });

    describe('getRoomId', () => {
        const roomId = 'gameRoom-asddss-asdd';
        it('should return the roomId if the client is in a room', () => {
            socket.join(roomId);
            expect(gateway.getRoomId(socket)).toEqual(roomId);
        });
        it('should not return the roomId if the client isnt in one', () => {
            expect(gateway.getRoomId(socket)).toEqual(undefined);
        });
    });
});
