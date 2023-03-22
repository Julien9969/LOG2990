/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any -- need to use any to spy on private method */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { GameService } from '@app/services/game/game.service';
import { Session } from '@app/services/session/session';
import { SessionService } from '@app/services/session/session.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import { Server, Socket } from 'socket.io';
import { SessionGateway } from './session.gateway';
describe('SessionGateway', () => {
    let gateway: SessionGateway;
    let logger: SinonStubbedInstance<Logger>;
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

    describe('leaveRoom', () => {
        it('should make the client leave the room', () => {
            const gameId = '123';
            const roomId = `gameRoom-roomId-${gameId}-ASJndsajs`;
            const socketStub: any = { id: '122', rooms: [roomId], leave() {} };
            jest.spyOn(socketStub, 'leave');
            gateway.leaveRoom(socketStub);
            expect(socketStub.leave).toHaveBeenCalledWith(roomId);
        });
    });
});
