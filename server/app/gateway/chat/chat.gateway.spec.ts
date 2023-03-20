/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Message } from '@common/message';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import { BroadcastOperator, Server } from 'socket.io';
import { ChatGateway } from './chat.gateway';

describe('ChatGateway', () => {
    let gateway: ChatGateway;
    let logger: SinonStubbedInstance<Logger>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const socket: any = { id: '1234', rooms: new Set([]) };
    let server: SinonStubbedInstance<Server>;

    const exampleMessage: Message = {
        socketId: 'unknown',
        isFromSystem: true,
        sessionID: 12,
        author: 'michel',
        time: 1234,
        message: 'salut!',
    };

    const treatedMessage: Message = {
        socketId: '1234',
        isFromSystem: false,
        sessionID: 12,
        author: 'michel',
        time: 1234,
        message: 'salut!',
    };
    beforeEach(async () => {
        logger = createStubInstance(Logger);
        server = createStubInstance<Server>(Server);
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatGateway,
                {
                    provide: Logger,
                    useValue: logger,
                },
            ],
        }).compile();
        gateway = module.get<ChatGateway>(ChatGateway);
        gateway['server'] = server;
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });
    it('giveClientId should Call client.emit', () => {
        jest.spyOn(gateway, 'getGameRoom').mockImplementation(() => {
            return 'gameRoom1234';
        });
        socket.emit = () => {
            return undefined;
        };
        jest.spyOn(gateway['server'], 'to').mockReturnValue({
            emit: (event: string, clientId: string) => {
                expect(event).toEqual('giveClientID');
                expect(clientId).toEqual('1234');
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.giveclientId(socket);
    });
    it('dispatchMessageToAllClients should set the isFromSystem attribute of message to false', () => {
        jest.spyOn(gateway, 'getGameRoom').mockImplementation(() => {
            return 'gameRoom1234';
        });
        jest.spyOn(gateway['server'], 'to').mockReturnValue({
            emit: (event: string, message: Message) => {
                expect(event).toEqual('messageFromServer');
                expect(message).toEqual(treatedMessage);
            },
        } as BroadcastOperator<unknown, unknown>);

        gateway.dispatchMessageToAllClients(socket, exampleMessage);
    });

    it('getGameRoom should return a gameRoom if there is one', () => {
        socket.rooms = new Set(['adasdqe', 'gameRoom-124-123456789']);
        expect(gateway.getGameRoom(socket)).toEqual('gameRoom-124-123456789');
    });
    it('getGameRoom should return client.id if there is no gameRoom', () => {
        socket.rooms = new Set(['adasdqe']);
        expect(gateway.getGameRoom(socket)).toEqual('1234');
    });
});
