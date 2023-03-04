import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MatchMakingEvents } from './match-making.gateway.events';

@WebSocketGateway({ cors: true })
export class MatchmakingGateway implements OnGatewayInit {
    @WebSocketServer() protected server: Server;
    // the room where the client is waiting for an opponent
    private waitingRooms: [number, string][] = [];

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
    startMatchmaking(client: Socket, gameId: number) {
        const roomId = `gameRoom-${gameId}-${Date.now()}`;
        this.waitingRooms.push([gameId, roomId]);
        client.join(roomId);
        this.logger.log(`Game room created : ${roomId}`);

        this.logger.log(this.waitingRooms);
    }

    /**
     * ask if there is someone waiting for a specific game
     *
     * @param _ client that ask for the waiting list
     * @param gameId the id of the game the client wants to play
     * @returns if there is someone waiting for a specific game
     */
    @SubscribeMessage(MatchMakingEvents.SomeOneWaiting)
    isSomeOneWaiting(_: Socket, gameId: number) {
        const waitingRooms = this.filterRoomsByGameId(gameId);
        if (waitingRooms.length > 0) {
            return true;
        }
        return false;
    }

    /**
     * Remove the room from the waiting list if the client is the last one in the room
     * else notify the other client that the opponent left
     *
     * @param client client that left the room
     * @param gameId the id of the game the client wants to leave the waiting room
     */
    @SubscribeMessage(MatchMakingEvents.LeaveWaitingRoom)
    leaveWaitingRoom(client: Socket, gameId: number) {
        this.logger.log(`Client ${client.id} Leave room`);

        client.rooms.forEach((roomId) => {
            if (roomId.startsWith('gameRoom')) {
                if (this.serverRooms.get(roomId).size < 2) {
                    this.waitingRooms = this.removeThisRooms(roomId);
                    this.logger.log('was alone close Room ' + this.waitingRooms);
                } else {
                    this.logger.log('was not alone close Room ' + this.waitingRooms);
                    client.to(roomId).emit(MatchMakingEvents.OpponentLeft);
                    this.waitingRooms.push([gameId, roomId]);
                }
                client.leave(roomId);
            }
        });
    }

    /**
     * join the room if there is one available for the game
     *
     * @param client client that joined the room
     * @param playerInfo game id and player name
     */
    @SubscribeMessage(MatchMakingEvents.JoinRoom)
    joinRoom(client: Socket, playerInfo: { gameId: number; playerName: string }) {
        this.logger.log(`Client ${client.id} joined room`);
        const gameRooms = this.filterRoomsByGameId(playerInfo.gameId);
        if (gameRooms.length > 0) {
            const roomId = gameRooms[0][1];
            client.join(roomId);
            client.to(roomId).emit(MatchMakingEvents.OpponentJoined, playerInfo.playerName);
            this.waitingRooms = this.removeThisRooms(roomId);
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
        this.logger.log(`Client ${client.id} accepted opponent`);
        client.rooms.forEach((roomId) => {
            if (roomId.startsWith('gameRoom')) {
                if (this.serverRooms.get(roomId).size === 2) {
                    client.to(roomId).emit(MatchMakingEvents.AcceptOtherPlayer, playerName);
                    accepted = true;
                }
            }
        });
        return accepted;
    }

    /**
     * remove the other player from the room and put back the room in the waiting list
     *
     * @param client owner of the room
     * @param playerInfo the name of the player and the game id
     */
    @SubscribeMessage(MatchMakingEvents.RejectOpponent)
    rejectOpponent(client: Socket, playerInfo: { gameId: number; playerName: string }) {
        this.logger.log(`Client ${client.id} rejected opponent`);
        client.rooms.forEach((roomId) => {
            if (roomId.startsWith('gameRoom')) {
                client.to(roomId).emit(MatchMakingEvents.RejectOtherPlayer, playerInfo.playerName);
                this.removeOtherPlayer(client, roomId);
                this.waitingRooms.push([playerInfo.gameId, roomId]);
            }
        });
    }

    afterInit() {
        this.logger.log('Matchmaking gateway initialized');
    }

    removeOtherPlayer(client: Socket, roomId: string) {
        this.serverRooms.get(roomId).forEach((socketId) => {
            if (socketId !== client.id) {
                this.connectedClients.get(socketId).leave(roomId);
            }
        });
    }

    notWaitingRoom(roomId: string) {
        return this.waitingRooms.filter((room) => room[1] === roomId).length === 0;
    }

    private removeThisRooms(roomId: string) {
        return this.waitingRooms.filter((room) => room[1] !== roomId);
    }

    private filterRoomsByGameId(gameId: number) {
        return this.waitingRooms.filter((room) => room[0] === gameId);
    }
}
