import { MatchMakingEvents } from '@app/gateway/match-making/match-making.gateway.events';
import { Rooms } from '@app/gateway/match-making/rooms';
import { SessionEvents } from '@common/session.gateway.events';
import { Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators';
import { OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class MatchmakingGateway implements OnGatewayDisconnect {
    @WebSocketServer() protected server: Server;
    // Salle dans lesquelles les clients attendent un adversaire
    private waitingRooms: Rooms = new Rooms();
    // Salle dans lesquelles on attend que les clients s'accepetent
    private acceptingRooms: Rooms = new Rooms();

    constructor(private readonly logger: Logger) {}

    get serverRooms(): Map<string, Set<string>> {
        return this.server.sockets.adapter.rooms;
    }

    get connectedClients(): Map<string, Socket> {
        return this.server.sockets.sockets;
    }

    /**
     * Cree une salle d'attente pour le jeu
     *
     * @param client client qui demande la création d'une salle
     * @param gameId l'id du jeux
     */
    @SubscribeMessage(MatchMakingEvents.StartMatchmaking)
    startMatchmaking(client: Socket, gameId: string) {
        const roomId = `gameRoom-${gameId}-${Date.now()}`;
        this.waitingRooms.push({ gameId, roomId });
        client.join(roomId);

        this.logger.log('GameRoom created : ' + roomId);
        this.server.emit(MatchMakingEvents.UpdateRoomView);
    }

    /**
     * demande si la salle est joinable
     *
     * @param _ client qui demande la liste des jeux en attente
     * @param gameId l'id du jeux
     * @returns si quelqu'un est en attente
     */
    @SubscribeMessage(MatchMakingEvents.SomeOneWaiting)
    isSomeOneWaiting(_: Socket, gameId: string) {
        const waitingRooms = this.waitingRooms.filterRoomsByGameId(gameId);
        return waitingRooms.length > 0;
    }

    /**
     * demande si une salle est crée pour ce jeu
     *
     * @param _ client qui demande la liste des jeux en attente
     * @param gameId l'id du jeux
     */
    @SubscribeMessage(MatchMakingEvents.RoomCreatedForThisGame)
    roomCreatedForThisGame(_: Socket, gameId: string) {
        const waitingRooms = this.waitingRooms.filterRoomsByGameId(gameId);
        const acceptingRooms = this.acceptingRooms.filterRoomsByGameId(gameId);
        return waitingRooms.length > 0 || acceptingRooms.length > 0;
    }

    /**
     * Supprime la salle de la liste des salles d'attente si le client est le seul
     * Sinon envoie un message à l'autre joueur pour lui dire que l'autre joueur à quitté
     *
     * @param client le client qui a quitté la salle
     * @param gameId l'id du jeux que l'on quitte
     */
    @SubscribeMessage(MatchMakingEvents.LeaveWaitingRoom)
    leaveWaitingRoom(client: Socket, gameId: string) {
        client.rooms.forEach((roomId) => {
            if (roomId.startsWith('gameRoom')) {
                if (this.serverRooms.get(roomId).size < 2) {
                    this.waitingRooms.removeThisRoom(roomId);
                    this.logger.log(`${client.id} : leave, room deleted : ` + roomId);
                } else {
                    this.logger.log(`${client.id} : leave and was not alone, room still exist : ` + roomId);
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
     * Rejoint la room de l'adversaire et le notifie
     *
     * @param client Le client qui veut rejoindre la room
     * @param playerInfo l'id du jeu et le nom du joueur
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
     * Accepte l'aderversaire et le notifie
     * Si l'adversaire à quitté on averti le propriétaire de la salle
     *
     * @param client socket du pr
     * @param playerName nom du propriétaire de la salle
     * @returns si il peur être accepté
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
     * Enleve l'autre joueur de la salle et remet la room dans la WaitingRooms
     *
     * @param client Propriétaire de la salle
     * @param playerInfo Nom du joueur et id du jeu
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

        this.serverRooms.forEach((socketIds, roomId) => {
            if (roomId.startsWith('gameRoom')) {
                if (socketIds.size < 2 && !this.waitingRooms.find(roomId) && !this.acceptingRooms.find(roomId)) {
                    this.server.to(roomId).emit(SessionEvents.OpponentLeftGame);
                    this.logger.log(`Client ${client.id} left room : ${roomId}`);
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

    notifyGameDeleted(gameId: string) {
        this.waitingRooms.filterRoomsByGameId(gameId).forEach((room) => {
            this.server.to(room.roomId).emit(MatchMakingEvents.GameDeleted);
            this.serverRooms.get(room.roomId).forEach((clientId) => {
                this.connectedClients.get(clientId).leave(room.roomId);
            });
        });
        this.acceptingRooms.filterRoomsByGameId(gameId).forEach((room) => {
            this.server.to(room.roomId).emit(MatchMakingEvents.GameDeleted);
            this.serverRooms.get(room.roomId).forEach((clientId) => {
                this.connectedClients.get(clientId).leave(room.roomId);
            });
        });
    }
}
