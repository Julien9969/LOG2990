import { ChatEvents } from '@common/chat.gateway.events';
import { Message } from '@common/message';
import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class ChatGateway {
    @WebSocketServer() protected server: Server;
    constructor(private readonly logger: Logger) {}
    @SubscribeMessage(ChatEvents.GiveName)
    giveclientId(client: Socket): void {
        client.emit(ChatEvents.GiveClientID, client.id);
    }

    @SubscribeMessage(ChatEvents.MessageFromClient)
    dispatchMessageToAllClients(client: Socket, message: Message): void {
        message.isFromSystem = false;
        message.socketId = client.id;
        const gameRoom = this.getGameRoom(client);
        this.server.to(gameRoom).emit(ChatEvents.MessageFromServer, message);
    }

    broadcastNewHighScore(message: Message): void {
        message.isFromSystem = true;
        this.server.emit(ChatEvents.MessageFromServer, message);
    }

    getGameRoom(client: Socket): string {
        let correctRoom = client.id;
        client.rooms.forEach((room: string) => {
            if (room.startsWith('gameRoom')) {
                correctRoom = room;
            }
        });
        return correctRoom;
    }
}
