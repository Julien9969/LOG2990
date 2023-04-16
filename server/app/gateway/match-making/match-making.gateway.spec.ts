/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any -- need to use any to spy on private method */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { MatchmakingGateway } from '@app/gateway/match-making/match-making.gateway';
import { ChatEvents } from '@common/chat.gateway.events';
import { MatchMakingEvents } from '@common/match-making.gateway.events';
import { SessionEvents } from '@common/session.gateway.events';
import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { createStubInstance, SinonStubbedInstance, /* , match,*/ stub } from 'sinon';
import { BroadcastOperator, Server, Socket } from 'socket.io';

jest.mock('mongoose');

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
                {
                    provide: getModelToken('Game'),
                    useValue: {
                        find: jest.fn(),
                    },
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
            expect(gateway['serverRooms']).toEqual(roomsStub);
        });

        it('connectedClients should return the sockets of the server', () => {
            const socketsStub = new Map([['socketId', socket]]);
            stub(gateway as any, 'server').value({ sockets: { sockets: socketsStub } });
            expect(gateway['connectedClients']).toEqual(socketsStub);
        });
    });

    describe('startMatchmaking', () => {
        it('startMatchMaking should create a room with the gameId and the date in the name', () => {
            jest.spyOn(Date, 'now').mockImplementation(() => {
                return 123456789;
            });
            const expectedRoomId = `gameRoom-${'1'}-${123456789}`;
            gateway.startMatchmaking(socket, '1');
            expect(socket.join.calledWith(expectedRoomId)).toBeTruthy();
        });

        it('startMatchmaking should add the room to waitingRooms and send updateRoomView', () => {
            const pushSpy = jest.spyOn(gateway['waitingRooms'], 'push');
            expect(gateway['waitingRooms'].length).toEqual(0);
            jest.spyOn(gateway['server'], 'emit');

            gateway.startMatchmaking(socket, '1');
            expect(pushSpy).toHaveBeenCalled();
            expect(gateway['waitingRooms'].length).toEqual(1);
            expect(gateway['server'].emit).toHaveBeenCalledWith(MatchMakingEvents.UpdateRoomView);
        });
    });

    describe('isSomeOneWaiting', () => {
        it('isSomeOneWaiting should call filterRoomsByGameId and return true if there is a room for a gameId in waitingRooms', () => {
            const gameId = '123';
            jest.spyOn(gateway['waitingRooms'], 'filterRoomsByGameId').mockReturnValue([{ gameId, roomId: 'roomName' }]);
            expect(gateway.isSomeOneWaiting(socket, gameId)).toBeTruthy();
            expect(gateway['waitingRooms'].filterRoomsByGameId).toHaveBeenCalled();
        });

        it('isSomeOneWaiting should call filterRoomsByGameId and return false if there is no room for a gameId in waitingRooms', () => {
            const roomId = '123';
            jest.spyOn(gateway['waitingRooms'], 'filterRoomsByGameId').mockReturnValue([]);

            gateway['waitingRooms'].push({ gameId: '124', roomId: 'roomName' });
            expect(gateway.isSomeOneWaiting(socket, roomId)).toBeFalsy();
            expect(gateway['waitingRooms'].filterRoomsByGameId).toHaveBeenCalled();
        });
    });

    describe('RoomCreatedForThisGame', () => {
        it('should call filterRoomsByGameId on waitingRooms and acceptingRooms', () => {
            const gameId = '123';
            jest.spyOn(gateway['waitingRooms'], 'filterRoomsByGameId').mockReturnValue([{ gameId, roomId: 'roomName' }]);
            jest.spyOn(gateway['acceptingRooms'], 'filterRoomsByGameId').mockReturnValue([{ gameId, roomId: 'roomName' }]);

            gateway.roomCreatedForThisGame(socket, gameId);
            expect(gateway['acceptingRooms'].filterRoomsByGameId).toHaveBeenCalled();
            expect(gateway['waitingRooms'].filterRoomsByGameId).toHaveBeenCalled();
        });

        it('should return false if no room match in waitingRooms or acceptingRooms', () => {
            const roomId = '123';
            jest.spyOn(gateway['waitingRooms'], 'filterRoomsByGameId').mockReturnValue([]);
            jest.spyOn(gateway['acceptingRooms'], 'filterRoomsByGameId').mockReturnValue([]);

            expect(gateway.roomCreatedForThisGame(socket, roomId)).toBeFalsy();
        });

        it('should return true if a room match in waitingRooms', () => {
            const gameId = '123';
            jest.spyOn(gateway['waitingRooms'], 'filterRoomsByGameId').mockReturnValue([{ gameId, roomId: 'roomName' }]);
            jest.spyOn(gateway['acceptingRooms'], 'filterRoomsByGameId').mockReturnValue([]);

            expect(gateway.roomCreatedForThisGame(socket, gameId)).toBeTruthy();
        });

        it('should return true if a room match in acceptingRooms', () => {
            const gameId = '123';
            jest.spyOn(gateway['waitingRooms'], 'filterRoomsByGameId').mockReturnValue([]);
            jest.spyOn(gateway['acceptingRooms'], 'filterRoomsByGameId').mockReturnValue([{ gameId, roomId: 'roomName' }]);

            expect(gateway.roomCreatedForThisGame(socket, gameId)).toBeTruthy();
        });

        it('should return true if a room match in acceptingRooms and waitingRooms', () => {
            const gameId = '123';
            jest.spyOn(gateway['waitingRooms'], 'filterRoomsByGameId').mockReturnValue([{ gameId, roomId: 'roomName' }]);
            jest.spyOn(gateway['acceptingRooms'], 'filterRoomsByGameId').mockReturnValue([{ gameId, roomId: 'roomName' }]);

            expect(gateway.roomCreatedForThisGame(socket, gameId)).toBeTruthy();
        });
    });

    describe('leaveWaitingRoom', () => {
        it('leaveWaitingRoom should call removeThisRooms on waitingRooms if the client was alone', () => {
            const roomID = 'gameRoom-124-123456789';
            gateway['waitingRooms'].push({ gameId: '124', roomId: roomID });
            jest.spyOn(gateway['waitingRooms'], 'removeThisRoom');

            stub(socket, 'rooms').value(new Set([roomID]));
            stub(gateway, 'serverRooms' as any).value(new Map([[roomID, new Set([''])]]));

            expect(gateway['waitingRooms'].length).toEqual(1);
            gateway.leaveWaitingRoom(socket, '124');
            expect(gateway['waitingRooms'].length).toEqual(0);
            expect(socket.leave.calledWith(roomID)).toBeTruthy();
        });

        it('should remove the room form acceptingRooms and add it to waitingRooms and send opponentLeft to the room if was not alone', () => {
            const roomId = 'gameRoom-124-123456789';
            socket.join(roomId);
            gateway['acceptingRooms'].push({ gameId: '124', roomId });

            stub(socket, 'rooms').value(new Set([roomId]));
            stub(gateway, 'serverRooms' as any).value(new Map([[roomId, new Set(['1', '2'])]])); // 2 clients in the room
            jest.spyOn(gateway['acceptingRooms'], 'removeThisRoom');
            jest.spyOn(gateway['waitingRooms'], 'insertSortByDate');

            socket.to.returns({
                emit: (event: string) => {
                    expect(event).toEqual(MatchMakingEvents.OpponentLeft);
                },
            } as BroadcastOperator<unknown, unknown>);

            expect(gateway['waitingRooms'].length).toEqual(0);
            expect(gateway['acceptingRooms'].length).toEqual(1);
            gateway.leaveWaitingRoom(socket, '124');
            expect(gateway['waitingRooms'].length).toEqual(1);
            expect(gateway['acceptingRooms'].length).toEqual(0);

            expect(gateway['acceptingRooms'].removeThisRoom).toHaveBeenCalled();
            expect(gateway['waitingRooms'].insertSortByDate).toHaveBeenCalled();
            expect(socket.to.calledWith(roomId)).toBeTruthy();
            expect(socket.leave.calledWith(roomId)).toBeTruthy();
        });

        it('should do nothing if client room don`t start with gameRoom', () => {
            gateway['waitingRooms'].push({ gameId: '124', roomId: 'gameRoom-3232-23232' });
            stub(socket, 'rooms').value(new Set(['roomName']));
            const startWithSpy = jest.spyOn(String.prototype, 'startsWith');

            expect(gateway['waitingRooms']).toHaveLength(1);
            gateway.leaveWaitingRoom(socket, '124');
            expect(gateway['waitingRooms']).toHaveLength(1);
            expect(socket.leave.called).toBeFalsy();
            expect(startWithSpy).toHaveBeenCalled();
        });

        it('should emit updateRoomView', () => {
            stub(socket, 'rooms').value(new Set());
            jest.spyOn(gateway['server'], 'emit').mockImplementation();
            gateway.leaveWaitingRoom(socket, '124');
            expect(gateway['server'].emit).toHaveBeenCalledWith(MatchMakingEvents.UpdateRoomView);
        });
    });

    describe('joinRoom', () => {
        it('should call filterRoomsByGameId and do nothing if returned array is empty', () => {
            jest.spyOn(gateway['waitingRooms'], 'filterRoomsByGameId').mockReturnValue([]);
            gateway.joinRoom(socket, { gameId: '0', playerName: '' });
            expect(gateway['waitingRooms'].filterRoomsByGameId).toHaveBeenCalled();
            expect(socket.join.called).toBeFalsy();
        });

        it('should call socket.join, send "opponentJoined", removeThisRooms on waitingRooms if the returned array is not empty', () => {
            jest.spyOn(gateway['waitingRooms'], 'filterRoomsByGameId').mockReturnValue([{ roomId: 'gameRoom-124-123456789', gameId: '124' }]);
            socket.to.returns({
                emit: (event: string, playerName: string) => {
                    expect(event).toEqual(MatchMakingEvents.OpponentJoined);
                    expect(playerName).toEqual('test');
                },
            } as BroadcastOperator<unknown, unknown>);
            jest.spyOn(gateway['waitingRooms'], 'removeThisRoom');

            gateway.joinRoom(socket, { gameId: '0', playerName: 'test' });
            expect(gateway['waitingRooms'].filterRoomsByGameId).toHaveBeenCalled();
            expect(socket.join.called).toBeTruthy();
            expect(socket.to.called).toBeTruthy();
            expect(gateway['waitingRooms'].removeThisRoom).toHaveBeenCalled();
            expect(gateway['waitingRooms'].length).toEqual(0);
        });

        it('should call push on acceptingRooms and send UpdateRoomView if the returned array is not empty', () => {
            jest.spyOn(gateway['waitingRooms'], 'filterRoomsByGameId').mockReturnValue([{ roomId: 'gameRoom-124-123456789', gameId: '124' }]);
            jest.spyOn(gateway['acceptingRooms'], 'push');

            socket.to.returns({
                emit: (event: string, playerName: string) => {
                    expect(event).toEqual(MatchMakingEvents.OpponentJoined);
                    expect(playerName).toEqual('test');
                },
            } as BroadcastOperator<unknown, unknown>);
            jest.spyOn(gateway['waitingRooms'], 'removeThisRoom');
            jest.spyOn(gateway['server'], 'emit').mockImplementation();

            gateway.joinRoom(socket, { gameId: '0', playerName: 'test' });
            expect(gateway['acceptingRooms'].push).toHaveBeenCalled();
            expect(gateway['server'].emit).toHaveBeenCalledWith(MatchMakingEvents.UpdateRoomView);
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

        it('should send "acceptOtherPlayer" call removeThisRoom on acceptingRooms and return true if the AcceptedPlayer is still in the room', () => {
            const roomId = 'gameRoom-124-123456789';
            stub(socket, 'rooms').value(new Set([roomId]));
            stub(gateway, 'serverRooms' as any).value(new Map([[roomId, new Set(['1', '2'])]])); // 2 clients in the room
            jest.spyOn(gateway['acceptingRooms'], 'removeThisRoom');

            socket.to.returns({
                emit: (event: string, playerName: string) => {
                    expect(event).toEqual(MatchMakingEvents.AcceptOtherPlayer);
                    expect(playerName).toEqual('name');
                },
            } as BroadcastOperator<unknown, unknown>);

            const result = gateway.acceptOpponent(socket, 'name');
            expect(socket.to.calledWith(roomId)).toBeTruthy();
            expect(result).toBeTruthy();
            expect(gateway['acceptingRooms'].removeThisRoom).toHaveBeenCalled();
        });

        it('should not send "acceptOtherPlayer" and return false if the AcceptedPlayer left the room', () => {
            const roomId = 'gameRoom-124-123456789';
            stub(socket, 'rooms').value(new Set([roomId]));
            stub(gateway, 'serverRooms' as any).value(new Map([[roomId, new Set(['1'])]])); // 1 client in the room

            const result = gateway.acceptOpponent(socket, 'name');
            expect(socket.to.calledWith(roomId)).toBeFalsy();
            expect(result).toBeFalsy();
        });

        it('should emit updateRoomView ', () => {
            stub(socket, 'rooms').value(new Set());
            jest.spyOn(gateway['server'], 'emit').mockImplementation();
            gateway.acceptOpponent(socket, 'name');
            expect(gateway['server'].emit).toHaveBeenCalledWith(MatchMakingEvents.UpdateRoomView);
        });
    });

    describe('rejectOpponent', () => {
        it('should do nothing if the room don`t start with gameRoom', () => {
            stub(socket, 'rooms').value(new Set(['roomName']));
            const startWithSpy = jest.spyOn(String.prototype, 'startsWith');
            const removeOtherPlayerSpy = jest.spyOn(MatchmakingGateway.prototype as any, 'removeOtherPlayer');

            gateway.rejectOpponent(socket, { gameId: '124', playerName: 'name' });
            expect(startWithSpy).toHaveBeenCalled();
            expect(socket.to.called).toBeFalsy();
            expect(removeOtherPlayerSpy).not.toHaveBeenCalled();
        });

        it('should send "rejectOtherPlayer" and put back the room in the waitingRooms and remove it from acceptingRooms', () => {
            const roomId = 'gameRoom-124-123456789';
            stub(socket, 'rooms').value(new Set([roomId]));
            stub(gateway, 'serverRooms' as any).value(new Map([[roomId, new Set(['1', '2'])]])); // 2 clients in the room

            gateway['acceptingRooms'].push({ roomId, gameId: '124' });

            jest.spyOn(MatchmakingGateway.prototype as any, 'removeOtherPlayer').mockImplementation((client: Socket, clientRoomId: string) => {
                expect(clientRoomId).toEqual(roomId);
                expect(client).toEqual(socket);
            });

            jest.spyOn(MatchmakingGateway.prototype as any, 'mergeRoomsIfPossible').mockImplementation(() => {});

            socket.to.returns({
                emit: (event: string, playerName: string) => {
                    expect(event).toEqual(MatchMakingEvents.RejectOtherPlayer);
                    expect(playerName).toEqual('name');
                },
            } as BroadcastOperator<unknown, unknown>);

            expect(gateway['waitingRooms'].length).toEqual(0);
            expect(gateway['acceptingRooms'].length).toEqual(1);

            gateway.rejectOpponent(socket, { gameId: '124', playerName: 'name' });
            expect(gateway['waitingRooms'].length).toEqual(1);
            expect(gateway['acceptingRooms'].length).toEqual(0);

            expect(gateway.mergeRoomsIfPossible).toHaveBeenCalled();
            expect(socket.to.calledWith(roomId)).toBeTruthy();
        });
    });

    it('mergeRoomsIfPossible should merge the rooms of a same game', () => {
        const gameId = '124';
        const roomId = 'gameRoom-124-123456789';
        const otherRoomId = 'gameRoom-124-987654321';
        const otherClient = createStubInstance<Socket>(Socket);

        gateway['waitingRooms'].push({ gameId, roomId });
        gateway['waitingRooms'].push({ gameId, roomId: otherRoomId });

        socket.join(roomId);
        otherClient.join(otherRoomId);

        jest.spyOn(gateway['server'], 'to').mockReturnValue({
            emit: (event: string) => {
                expect(event).toEqual(MatchMakingEvents.RoomReachable);
            },
        } as BroadcastOperator<unknown, unknown>);

        stub(gateway, 'connectedClients' as any).value(
            new Map([
                ['1', socket],
                ['2', otherClient],
            ]),
        );
        stub(gateway, 'serverRooms' as any).value(
            new Map([
                [roomId, new Set(['1'])],
                [otherRoomId, new Set(['2'])],
            ]),
        );

        expect(gateway['waitingRooms']).toHaveLength(2);
        gateway['mergeRoomsIfPossible'](gameId);
        expect(gateway['waitingRooms']).toHaveLength(1);
        expect(otherClient.leave.calledWith(otherRoomId)).toBeTruthy();
    });

    it('mergeRoomsIfPossible should not merge the rooms of a different game', () => {
        const gameId = '124';
        const roomId = 'gameRoom-124-123456789';
        const otherRoomId = 'gameRoom-125-987654321';
        const otherClient = createStubInstance<Socket>(Socket);

        gateway['waitingRooms'].push({ gameId, roomId });
        gateway['waitingRooms'].push({ gameId: '125', roomId: otherRoomId });

        socket.join(roomId);
        otherClient.join(otherRoomId);

        expect(gateway['waitingRooms']).toHaveLength(2);
        gateway['mergeRoomsIfPossible'](gameId);
        expect(gateway['waitingRooms']).toHaveLength(2);
    });

    describe('removeOtherPlayer', () => {
        it('should remove the other player from the room', () => {
            const roomId = 'gameRoom-124-123456789';
            const otherClient = createStubInstance<Socket>(Socket);

            socket.join(roomId);
            otherClient.join(roomId);

            stub(gateway, 'connectedClients' as any).value(
                new Map([
                    ['1', socket],
                    ['2', otherClient],
                ]),
            );
            stub(gateway, 'serverRooms' as any).value(new Map([[roomId, new Set(['1', '2'])]])); // 2 clients id

            gateway['removeOtherPlayer'](socket, roomId);

            expect(otherClient.leave.calledWith(roomId)).toBeTruthy();
        });
    });

    describe('handleDisconnect', () => {
        it('should remove the room that are not in the server', () => {
            stub(gateway, 'serverRooms' as any).value(new Map([]));
            const roomId = 'gameRoom-124-123456789';
            gateway['waitingRooms'].push({ gameId: '124', roomId });
            gateway.handleDisconnect(socket);
            expect(gateway['waitingRooms']).toHaveLength(0);
        });

        it('should remove the acceptingRoom if not in server', () => {
            stub(gateway, 'serverRooms' as any).value(new Map([]));
            const roomId = 'gameRoom-124-123456789';
            gateway['acceptingRooms'].push({ gameId: '124', roomId });
            expect(gateway['acceptingRooms']).toHaveLength(1);
            gateway.handleDisconnect(socket);
            expect(gateway['acceptingRooms']).toHaveLength(0);
        });

        it('should emit opponentLeft if the accepting room exist', () => {
            const roomId = 'gameRoom-124-123456789';
            stub(gateway, 'serverRooms' as any).value(new Map([[roomId, new Set(['1'])]]));
            stub(gateway['acceptingRooms'], 'find').returns({ gameId: '124', roomId });
            jest.spyOn(gateway['server'], 'to').mockReturnValue({
                emit: (event: string) => {
                    expect(event).toEqual(MatchMakingEvents.OpponentLeft);
                },
            } as BroadcastOperator<unknown, unknown>);

            jest.spyOn(gateway['waitingRooms'], 'insertSortByDate').mockImplementation(() => {});
            jest.spyOn(MatchmakingGateway.prototype as any, 'mergeRoomsIfPossible').mockImplementation(() => {});

            jest.spyOn(gateway['server'], 'emit');

            gateway['acceptingRooms'].push({ gameId: '124', roomId });
            expect(gateway['acceptingRooms']).toHaveLength(1);
            gateway.handleDisconnect(socket);
            expect(gateway['acceptingRooms']).toHaveLength(0);
            expect(gateway['server'].emit).toHaveBeenCalledWith('updateRoomView');
        });

        it('should emit UpdateRoomView', () => {
            stub(gateway, 'serverRooms' as any).value(new Map([]));
            jest.spyOn(gateway['server'], 'emit');
            gateway.handleDisconnect(socket);
            expect(gateway['server'].emit).toHaveBeenCalledWith('updateRoomView');
        });

        it('should send SessionEvents.OpponentLeftGame if room have 1 players but not in waiting or accepting', () => {
            const roomId = 'gameRoom-124-123456789';
            stub(gateway, 'serverRooms' as any).value(new Map([[roomId, new Set(['1'])]]));
            jest.spyOn(gateway['server'], 'to').mockReturnValue({
                emit: (event: string) => {
                    expect(event === SessionEvents.OpponentLeftGame || event === ChatEvents.SystemMessageFromServer).toBeTruthy();
                },
            } as BroadcastOperator<unknown, unknown>);

            gateway.handleDisconnect(socket);
        });
    });

    it('anyGamePlayable should return true if any game is exist', async () => {
        jest.spyOn(gateway['gameModel'], 'find').mockReturnValue({
            limit: () => [
                {
                    id: '613712f7b7025984b080cea9',
                },
            ],
        } as any);
        const result = await gateway.anyGamePlayable(socket);
        expect(gateway['gameModel'].find).toHaveBeenCalled();
        expect(result).toBeTruthy();
    });

    it('anyGamePlayable should return false if no game is exist', async () => {
        jest.spyOn(gateway['gameModel'], 'find').mockReturnValue({
            limit: () => [],
        } as any);
        const result = await gateway.anyGamePlayable(socket);
        expect(gateway['gameModel'].find).toHaveBeenCalled();
        expect(result).toBeFalsy();
    });

    it('anyGamePlayable should return false if an error occured', async () => {
        jest.spyOn(gateway['gameModel'], 'find').mockImplementation(() => {
            throw new Error('error');
        });
        const result = await gateway.anyGamePlayable(socket);
        expect(gateway['gameModel'].find).toHaveBeenCalled();
        expect(result).toBeFalsy();
    });

    it('notifyGameDeleted should emit GameDeleted to room that correspond to gameId', () => {
        const roomId = 'gameRoom-124-123456789';
        gateway['waitingRooms'].push({ gameId: '124', roomId });
        gateway['acceptingRooms'].push({ gameId: '124', roomId });
        stub(gateway, 'connectedClients' as any).value(new Map([['1', socket]]));
        stub(gateway, 'serverRooms' as any).value(new Map([[roomId, new Set(['1'])]]));

        socket.join(roomId);

        jest.spyOn(gateway['server'], 'to').mockReturnValue({
            emit: (event: string) => {
                expect(event).toEqual(SessionEvents.GameDeleted);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.notifyGameDeleted('124');
    });
});
