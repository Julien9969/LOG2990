import { MatchMakingEvents } from '@app/gateway/match-making/match-making.gateway.events';
import { Rooms } from '@app/gateway/match-making/rooms';
import { Logger } from '@nestjs/common';
import { OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class MatchmakingGateway implements OnGatewayDisconnect {
    @WebSocketServer() protected server: Server;
    // the room where the client is waiting for an opponent
    private waitingRooms: Rooms = new Rooms();
    // room where one client wait for the other to accept him
    private acceptingRooms: Rooms = new Rooms();

    constructor(private readonly logger: Logger) {}

    get serverRooms(): Map<string, Set<string>> {
        return this.server.sockets.adapter.rooms;
    }

    get connectedClients(): Map<string, Socket> {
        return this.server.sockets.sockets;
    }

    /**
     * Create a room for the client and add it to the waiting list
     *
     * @param client client that created the room
     * @param gameId the id of the game the client wants to play
     */
    @SubscribeMessage(MatchMakingEvents.StartMatchmaking)
    startMatchmaking(client: Socket, gameId: string) {
        const roomId = `gameRoom-${gameId}-${Date.now()}`;
        this.waitingRooms.push({ gameId, roomId });
        client.join(roomId);

        this.logger.log('Current games rooms : ' + JSON.stringify(this.waitingRooms));
        this.server.emit(MatchMakingEvents.UpdateRoomView);
    }

    /**
     * ask if there is someone waiting for a specific game
     *
     * @param _ client that ask for the waiting list
     * @param gameId the id of the game the client wants to play
     * @returns if there is someone waiting for a specific game
     */
    @SubscribeMessage(MatchMakingEvents.SomeOneWaiting)
    isSomeOneWaiting(_: Socket, gameId: string) {
        const waitingRooms = this.waitingRooms.filterRoomsByGameId(gameId);
        return waitingRooms.length > 0;
    }

    /**
     * ask if this game have a room created for it even if two player are in acceptation
     *
     * @param _ client that ask for the waiting list
     * @param gameId the id of the game the client wants to play
     */
    @SubscribeMessage(MatchMakingEvents.RoomCreatedForThisGame)
    roomCreatedForThisGame(_: Socket, gameId: string) {
        const waitingRooms = this.waitingRooms.filterRoomsByGameId(gameId);
        const acceptingRooms = this.acceptingRooms.filterRoomsByGameId(gameId);
        return waitingRooms.length > 0 || acceptingRooms.length > 0;
    }

    /**
     * Remove the room from the waiting list if the client is the last one in the room
     * else notify the other client that the opponent opponent Left the room
     *
     * @param client client that left the room
     * @param gameId the id of the game the client wants to leave the waiting room
     */
    @SubscribeMessage(MatchMakingEvents.LeaveWaitingRoom)
    leaveWaitingRoom(client: Socket, gameId: string) {
        client.rooms.forEach((roomId) => {
            if (roomId.startsWith('gameRoom')) {
                if (this.serverRooms.get(roomId).size < 2) {
                    this.waitingRooms.removeThisRoom(roomId);
                    this.logger.log(`${client.id} : leave and was alone, close this room : ` + this.waitingRooms);
                } else {
                    this.logger.log(`${client.id} : leave and was not alone, room still exist : ` + this.waitingRooms);
                    client.to(roomId).emit(MatchMakingEvents.OpponentLeft);
                    this.acceptingRooms.removeThisRoom(roomId);
                    this.waitingRooms.insertSortByDate(gameId, roomId);
                }
                client.leave(roomId);
                this.mergeRoomsIfPossible(gameId);
            }
        });
        this.server.emit(MatchMakingEvents.UpdateRoomView);
    }

    /**
     * join the room if there is one available for the game
     *
     * @param client client that joined the room
     * @param playerInfo game id and player name
     */
    @SubscribeMessage(MatchMakingEvents.JoinRoom)
    joinRoom(client: Socket, playerInfo: { gameId: string; playerName: string }) {
        const gameRooms = this.waitingRooms.filterRoomsByGameId(playerInfo.gameId);
        if (gameRooms.length > 0) {
            const roomId = gameRooms[0].roomId;
            client.join(roomId);
            client.to(roomId).emit(MatchMakingEvents.OpponentJoined, playerInfo.playerName);

            this.acceptingRooms.push(gameRooms[0]);
            this.waitingRooms.removeThisRoom(roomId);

            this.logger.log(`Client ${client.id} joined room : ${roomId}`);
            this.server.emit(MatchMakingEvents.UpdateRoomView);
        }
    }

    /**
     * Accept the opponent and notify the other client
     * if the other client left the room, notify the owner that the opponent left the room
     *
     * @param client owner of the room
     * @param playerName name of the owner
     * @returns if can be accepted
     */
    @SubscribeMessage(MatchMakingEvents.AcceptOpponent)
    acceptOpponent(client: Socket, playerName: string) {
        let accepted = false;
        client.rooms.forEach((roomId) => {
            if (roomId.startsWith('gameRoom')) {
                if (this.serverRooms.get(roomId).size === 2) {
                    client.to(roomId).emit(MatchMakingEvents.AcceptOtherPlayer, playerName);
                    this.acceptingRooms.removeThisRoom(roomId);
                    accepted = true;
                }
            }
        });
        this.server.emit(MatchMakingEvents.UpdateRoomView);
        return accepted;
    }

    /**
     * remove the other player from the room and put back the room in the waiting list
     *
     * @param client owner of the room
     * @param playerInfo the name of the player and the game id
     */
    @SubscribeMessage(MatchMakingEvents.RejectOpponent)
    rejectOpponent(client: Socket, playerInfo: { gameId: string; playerName: string }) {
        client.rooms.forEach((roomId) => {
            if (roomId.startsWith('gameRoom')) {
                client.to(roomId).emit(MatchMakingEvents.RejectOtherPlayer, playerInfo.playerName);
                this.removeOtherPlayer(client, roomId);
                this.acceptingRooms.removeThisRoom(roomId);
                this.waitingRooms.insertSortByDate(playerInfo.gameId, roomId);
            }
        });
        this.mergeRoomsIfPossible(playerInfo.gameId);
    }

    mergeRoomsIfPossible(gameId: string) {
        const gameRooms = this.waitingRooms.filterRoomsByGameId(gameId);
        if (gameRooms.length > 1) {
            this.serverRooms.get(gameRooms[1].roomId).forEach((socketId) => {
                this.connectedClients.get(socketId).leave(gameRooms[1].roomId);
                this.server.to(socketId).emit(MatchMakingEvents.RoomReachable);
            });
            this.waitingRooms.removeThisRoom(gameRooms[1].roomId);
            this.logger.log(`Rooms merged : ${gameRooms[0][1]} and ${gameRooms[1].roomId}`);
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected from Match-making : ${client.id}`);
        this.waitingRooms.forEach((room) => {
            if (!this.serverRooms.get(room.roomId)) {
                this.waitingRooms.removeThisRoom(room.roomId);
            }
        });

        this.acceptingRooms.forEach((acceptingRoom) => {
            if (!this.serverRooms.get(acceptingRoom.roomId)) {
                this.acceptingRooms.removeThisRoom(acceptingRoom.roomId);
            } else {
                if (this.serverRooms.get(acceptingRoom.roomId).size < 2) {
                    this.server.to(acceptingRoom.roomId).emit(MatchMakingEvents.OpponentLeft);

                    this.waitingRooms.insertSortByDate(acceptingRoom.gameId, acceptingRoom.roomId);
                    this.mergeRoomsIfPossible(acceptingRoom.gameId);
                    this.acceptingRooms.removeThisRoom(acceptingRoom.roomId);
                }
            }
        });
        this.server.emit(MatchMakingEvents.UpdateRoomView);
    }

    removeOtherPlayer(client: Socket, roomId: string) {
        this.serverRooms.get(roomId).forEach((socketId) => {
            if (socketId !== client.id) {
                this.connectedClients.get(socketId).leave(roomId);
            }
        });
    }
}
