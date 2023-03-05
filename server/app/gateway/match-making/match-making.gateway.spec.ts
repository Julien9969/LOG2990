/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any -- need to use any to spy on private method */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Test, TestingModule } from '@nestjs/testing';
import { MatchmakingGateway } from '@app/gateway/match-making/match-making.gateway';
import { Logger } from '@nestjs/common';
import { SinonStubbedInstance, createStubInstance, /* , match,*/ stub } from 'sinon';
import { Socket, Server, BroadcastOperator } from 'socket.io';
import { MatchMakingEvents } from '@app/gateway/match-making/match-making.gateway.events';

describe('MatchmakingGateway', () => {
    let gateway: MatchmakingGateway;
    let logger: SinonStubbedInstance<Logger>;
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;

    beforeEach(async () => {
        logger = createStubInstance(Logger);
        socket = createStubInstance<Socket>(Socket);
        server = createStubInstance<Server>(Server);
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MatchmakingGateway,
                {
                    provide: Logger,
                    useValue: logger,
                },
            ],
        }).compile();

        gateway = module.get<MatchmakingGateway>(MatchmakingGateway);
        gateway['server'] = server;
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('get', () => {
        it('serverRooms should return the rooms of the server', () => {
            const roomsStub = new Map([['roomId', new Set([socket.id])]]);
            stub(gateway as any, 'server').value({ sockets: { adapter: { rooms: roomsStub } } });
            expect(gateway.serverRooms).toEqual(roomsStub);
        });

        it('connectedClients should return the sockets of the server', () => {
            const socketsStub = new Map([['socketId', socket]]);
            stub(gateway as any, 'server').value({ sockets: { sockets: socketsStub } });
            expect(gateway.connectedClients).toEqual(socketsStub);
        });
    });

    describe('startMatchmaking', () => {
        it('startMatchMaking should create a room with the gameId and the date in the name', () => {
            jest.spyOn(Date, 'now').mockImplementation(() => {
                return 123456789;
            });
            const expectedRoomId = `gameRoom-${1}-${123456789}`;
            gateway.startMatchmaking(socket, 1);
            expect(socket.join.calledWith(expectedRoomId)).toBeTruthy();
        });

        it('startMatchmaking should add the room to waitingRooms', () => {
            const pushSpy = jest.spyOn(gateway['waitingRooms'], 'push');
            expect(gateway['waitingRooms']).toHaveLength(0);
            gateway.startMatchmaking(socket, 1);
            expect(pushSpy).toHaveBeenCalled();
            expect(gateway['waitingRooms']).toHaveLength(1);
        });
    });

    describe('isSomeOneWaiting', () => {
        it('isSomeOneWaiting should call filterRoomsByGameId and return true if there is a room for a gameId in waitingRooms', () => {
            const roomId = 123;
            jest.spyOn(MatchmakingGateway.prototype as any, 'filterRoomsByGameId').mockReturnValue([[roomId, 'roomName']]);

            gateway['waitingRooms'].push([roomId, 'roomName']);
            expect(gateway.isSomeOneWaiting(socket, roomId)).toBeTruthy();
            expect(gateway['filterRoomsByGameId']).toHaveBeenCalled();
        });

        it('isSomeOneWaiting should call filterRoomsByGameId and return false if there is no room for a gameId in waitingRooms', () => {
            const roomId = 123;
            jest.spyOn(MatchmakingGateway.prototype as any, 'filterRoomsByGameId').mockReturnValue([]);

            gateway['waitingRooms'].push([124, 'roomName']);
            expect(gateway.isSomeOneWaiting(socket, roomId)).toBeFalsy();
            expect(gateway['filterRoomsByGameId']).toHaveBeenCalled();
        });
    });

    describe('leaveWaitingRoom', () => {
        it('leaveWaitingRoom should call removeThisRooms if the client was alone', () => {
            const roomId = 'gameRoom-124-123456789';
            gateway['waitingRooms'].push([124, roomId]);
            jest.spyOn(MatchmakingGateway.prototype as any, 'removeThisRooms').mockReturnValue([]);

            stub(socket, 'rooms').value(new Set([roomId]));
            stub(gateway, 'serverRooms').value(new Map([[roomId, new Set([''])]]));

            expect(gateway['waitingRooms']).toHaveLength(1);
            gateway.leaveWaitingRoom(socket, 124);
            expect(gateway['waitingRooms']).toHaveLength(0);
            expect(socket.leave.calledWith(roomId)).toBeTruthy();
        });

        it('should add the room to waitingRooms if was not alone and send opponentLeft to the other client', () => {
            const roomId = 'gameRoom-124-123456789';
            socket.join(roomId);
            stub(socket, 'rooms').value(new Set([roomId]));
            stub(gateway, 'serverRooms').value(new Map([[roomId, new Set(['1', '2'])]])); // 2 clients in the room

            socket.to.returns({
                emit: (event: string) => {
                    expect(event).toEqual(MatchMakingEvents.OpponentLeft);
                },
            } as BroadcastOperator<unknown, unknown>);

            expect(gateway['waitingRooms']).toHaveLength(0);
            gateway.leaveWaitingRoom(socket, 124);
            expect(gateway['waitingRooms']).toHaveLength(1);
            expect(socket.leave.calledWith(roomId)).toBeTruthy();
            expect(socket.to.calledWith(roomId)).toBeTruthy();
        });

        it('should do nothing if the room don`t start with gameRoom', () => {
            const roomId = 'gameRoom-124-123456789';
            gateway['waitingRooms'].push([124, roomId]);
            stub(socket, 'rooms').value(new Set(['roomName']));
            stub(gateway, 'serverRooms').value(new Map([[roomId, new Set(['1', '2'])]])); // 2 clients in the room
            const startWithSpy = jest.spyOn(String.prototype, 'startsWith');

            expect(gateway['waitingRooms']).toHaveLength(1);
            gateway.leaveWaitingRoom(socket, 124);
            expect(gateway['waitingRooms']).toHaveLength(1);
            expect(socket.leave.calledWith(roomId)).toBeFalsy();
            expect(startWithSpy).toHaveBeenCalled();
        });
    });

    describe('joinRoom', () => {
        it('should call filterRoomsByGameId and do nothing if returned array is empty', () => {
            jest.spyOn(MatchmakingGateway.prototype as any, 'filterRoomsByGameId').mockReturnValue([]);
            gateway.joinRoom(socket, { gameId: 0, playerName: '' });
            expect(gateway['filterRoomsByGameId']).toHaveBeenCalled();
            expect(socket.join.called).toBeFalsy();
        });

        it('should call socket.join and send "opponentJoined" and removeThisRooms if the returned array is not empty', () => {
            jest.spyOn(MatchmakingGateway.prototype as any, 'filterRoomsByGameId').mockReturnValue([['gameRoom-124-123456789', 124]]);
            socket.to.returns({
                emit: (event: string, playerName: string) => {
                    expect(event).toEqual(MatchMakingEvents.OpponentJoined);
                    expect(playerName).toEqual('test');
                },
            } as BroadcastOperator<unknown, unknown>);
            jest.spyOn(MatchmakingGateway.prototype as any, 'removeThisRooms').mockReturnValue([]);

            gateway.joinRoom(socket, { gameId: 0, playerName: 'test' });
            expect(gateway['filterRoomsByGameId']).toHaveBeenCalled();
            expect(socket.join.called).toBeTruthy();
            expect(socket.to.called).toBeTruthy();
            expect(gateway['removeThisRooms']).toHaveBeenCalled();
            expect(gateway['waitingRooms']).toHaveLength(0);
        });
    });

    describe('acceptOpponent', () => {
        it('should do nothing if the room don`t start with gameRoom and return false', () => {
            stub(socket, 'rooms').value(new Set(['roomName']));
            const startWithSpy = jest.spyOn(String.prototype, 'startsWith');

            const result = gateway.acceptOpponent(socket, 'name');
            expect(startWithSpy).toHaveBeenCalled();
            expect(result).toBeFalsy();
        });

        it('should send "acceptOtherPlayer" and return true if the AcceptedPlayer is still in the room', () => {
            const roomId = 'gameRoom-124-123456789';
            stub(socket, 'rooms').value(new Set([roomId]));
            stub(gateway, 'serverRooms').value(new Map([[roomId, new Set(['1', '2'])]])); // 2 clients in the room

            socket.to.returns({
                emit: (event: string, playerName: string) => {
                    expect(event).toEqual(MatchMakingEvents.AcceptOtherPlayer);
                    expect(playerName).toEqual('name');
                },
            } as BroadcastOperator<unknown, unknown>);

            const result = gateway.acceptOpponent(socket, 'name');
            expect(socket.to.calledWith(roomId)).toBeTruthy();
            expect(result).toBeTruthy();
        });

        it('should not send "acceptOtherPlayer" and return false if the AcceptedPlayer left the room', () => {
            const roomId = 'gameRoom-124-123456789';
            stub(socket, 'rooms').value(new Set([roomId]));
            stub(gateway, 'serverRooms').value(new Map([[roomId, new Set(['1'])]])); // 1 client in the room

            const result = gateway.acceptOpponent(socket, 'name');
            expect(socket.to.calledWith(roomId)).toBeFalsy();
            expect(result).toBeFalsy();
        });
    });

    describe('rejectOpponent', () => {
        it('should do nothing if the room don`t start with gameRoom', () => {
            stub(socket, 'rooms').value(new Set(['roomName']));
            const startWithSpy = jest.spyOn(String.prototype, 'startsWith');
            const removeOtherPlayerSpy = jest.spyOn(MatchmakingGateway.prototype as any, 'removeOtherPlayer');

            gateway.rejectOpponent(socket, { gameId: 124, playerName: 'name' });
            expect(startWithSpy).toHaveBeenCalled();
            expect(socket.to.called).toBeFalsy();
            expect(removeOtherPlayerSpy).not.toHaveBeenCalled();
        });

        it('should send "rejectOtherPlayer" and put back the room in the waitingRoom array if room is valid', () => {
            const roomId = 'gameRoom-124-123456789';
            stub(socket, 'rooms').value(new Set([roomId]));
            stub(gateway, 'serverRooms').value(new Map([[roomId, new Set(['1', '2'])]])); // 2 clients in the room

            jest.spyOn(MatchmakingGateway.prototype as any, 'removeOtherPlayer').mockImplementation((client: Socket, clientRoomId: string) => {
                expect(clientRoomId).toEqual(roomId);
                expect(client).toEqual(socket);
            });

            // eslint-disable-next-line @typescript-eslint/no-empty-function
            jest.spyOn(MatchmakingGateway.prototype as any, 'mergeRoomsIfPossible').mockImplementation(() => {});

            socket.to.returns({
                emit: (event: string, playerName: string) => {
                    expect(event).toEqual(MatchMakingEvents.RejectOtherPlayer);
                    expect(playerName).toEqual('name');
                },
            } as BroadcastOperator<unknown, unknown>);

            expect(gateway['waitingRooms']).toHaveLength(0);
            gateway.rejectOpponent(socket, { gameId: 124, playerName: 'name' });
            expect(gateway.mergeRoomsIfPossible).toHaveBeenCalled();
            expect(gateway['waitingRooms']).toHaveLength(1);
            expect(socket.to.calledWith(roomId)).toBeTruthy();
            expect(gateway['removeOtherPlayer']).toHaveBeenCalled();
        });
    });

    it('mergeRoomsIfPossible should merge the rooms of a same game', () => {
        const gameId = 124;
        const roomId = 'gameRoom-124-123456789';
        const otherRoomId = 'gameRoom-124-987654321';
        const otherClient = createStubInstance<Socket>(Socket);

        gateway['waitingRooms'].push([gameId, roomId]);
        gateway['waitingRooms'].push([gameId, otherRoomId]);

        socket.join(roomId);
        otherClient.join(otherRoomId);

        socket.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(MatchMakingEvents.RoomReachable);
            },
        } as BroadcastOperator<unknown, unknown>);
        stub(gateway, 'connectedClients').value(
            new Map([
                ['1', socket],
                ['2', otherClient],
            ]),
        );
        stub(gateway, 'serverRooms').value(
            new Map([
                [roomId, new Set(['1'])],
                [otherRoomId, new Set(['2'])],
            ]),
        );

        expect(gateway['waitingRooms']).toHaveLength(2);
        gateway['mergeRoomsIfPossible'](socket, gameId);
        expect(gateway['waitingRooms']).toHaveLength(1);
        expect(otherClient.leave.calledWith(otherRoomId)).toBeTruthy();
        expect(otherClient.join.calledWith(roomId)).toBeTruthy();
    });

    it('mergeRoomsIfPossible should not merge the rooms of a different game', () => {
        const gameId = 124;
        const roomId = 'gameRoom-124-123456789';
        const otherRoomId = 'gameRoom-125-987654321';
        const otherClient = createStubInstance<Socket>(Socket);

        gateway['waitingRooms'].push([gameId, roomId]);
        gateway['waitingRooms'].push([125, otherRoomId]);

        socket.join(roomId);
        otherClient.join(otherRoomId);

        expect(gateway['waitingRooms']).toHaveLength(2);
        gateway['mergeRoomsIfPossible'](socket, gameId);
        expect(gateway['waitingRooms']).toHaveLength(2);
    });

    it('afterInit should log "Matchmaking gateway initialized"', () => {
        gateway.afterInit();
        expect(logger.log.calledWith('Matchmaking gateway initialized')).toBeTruthy();
    });

    describe('removeOtherPlayer', () => {
        it('should remove the other player from the room', () => {
            const roomId = 'gameRoom-124-123456789';
            const otherClient = createStubInstance<Socket>(Socket);

            socket.join(roomId);
            otherClient.join(roomId);

            stub(gateway, 'connectedClients').value(
                new Map([
                    ['1', socket],
                    ['2', otherClient],
                ]),
            );
            stub(gateway, 'serverRooms').value(new Map([[roomId, new Set(['1', '2'])]])); // 2 clients id

            gateway['removeOtherPlayer'](socket, roomId);

            expect(otherClient.leave.calledWith(roomId)).toBeTruthy();
        });
    });

    describe('notWaitingRoom', () => {
        it('should return true if the room is not in the waitingRoom array', () => {
            const roomId = 'gameRoom-124-123456789';
            stub(gateway, 'serverRooms').value(new Map([[roomId, new Set(['1', '2'])]])); // 2 clients in the room
            expect(gateway['notWaitingRoom'](roomId)).toBeTruthy();
        });

        it('should return false if the room is in the waitingRoom array', () => {
            const roomId = 'gameRoom-124-123456789';
            stub(gateway, 'serverRooms').value(new Map([[roomId, new Set(['1', '2'])]])); // 2 clients in the room
            gateway['waitingRooms'].push([124, roomId]);
            expect(gateway['notWaitingRoom'](roomId)).toBeFalsy();
        });
    });

    it('removeThisRooms should return an array of room without the room that match roomId', () => {
        const roomId = 'gameRoom-124-123456789';
        gateway['waitingRooms'].push([124, roomId]);
        expect(gateway['waitingRooms']).toHaveLength(1);
        const resultArray = gateway['removeThisRooms'](roomId);
        expect(resultArray).toHaveLength(0);
    });

    it('filterRoomsByGameId should return an array of room that match gameId', () => {
        const roomId = 'gameRoom-124-123456789';
        gateway['waitingRooms'].push([124, roomId]);
        gateway['waitingRooms'].push([125, roomId]);
        const resultArray = gateway['filterRoomsByGameId'](124);
        expect(resultArray).toHaveLength(1);
        expect(resultArray).toEqual([[124, roomId]]);
    });
});
