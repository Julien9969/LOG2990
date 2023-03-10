import { SessionService } from '@app/services/session/session.service';
import { Logger } from '@nestjs/common';
import { OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class SessionGateway implements OnGatewayDisconnect {
    // private readonly room = PRIVATE_ROOM_ID;
    @WebSocketServer() private server: Server;

    constructor(private readonly logger: Logger, private readonly sessionService: SessionService) {}

    @SubscribeMessage('session')
    message(client: Socket, message: string) {
        this.logger.log(`Message reçu : ${message} : ${client.id}`);
    }

    /**
     * when both players are in the same room and the creator ask,
     * the server will send the session id to both players
     *
     * @param client the client that asked for a session id
     * @param gameId the id of the game the client wants to play
     */
    @SubscribeMessage('askForSessionId')
    askForSessionId(client: Socket, gameId: string) {
        this.logger.log(`Client ${client.id} asked for session id`);
        const sessionId = this.sessionService.create(gameId);
        client.rooms.forEach((roomId) => {
            if (roomId.startsWith('gameRoom')) {
                this.server.to(roomId).emit('sessionId', sessionId);
            }
        });
    }

    @SubscribeMessage('leaveRoom')
    leaveRoom(client: Socket) {
        client.rooms.forEach((roomId) => {
            if (roomId.startsWith('gameRoom')) {
                client.leave(roomId);
            }
        });
    }
    // TODO : DELETE
    // afterInit() {
    //     setInterval(() => {
    //         this.emitTime();
    //     }, DELAY_BEFORE_EMITTING_TIME);
    // }

    // handleConnection(socket: Socket) {
    //     // message initial
    //     socket.emit(ChatEvents.Hello, 'Hello World!');
    // }

    handleDisconnect(socket: Socket) {
        this.logger.log(`Client sesson : ${socket.id}`);
    }

    // private emitTime() {
    //     this.server.emit(ChatEvents.Clock, new Date().toLocaleTimeString());
    // }
}
