import { Message } from '@common/message';
import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class ChatGateway {
    @WebSocketServer() protected server: Server;
    constructor(private readonly logger: Logger) {}
    @SubscribeMessage('giveName')
    giveclientId(client: Socket): void {
        client.emit('giveClientID', client.id);
    }

    @SubscribeMessage('messageFromClient')
    dispatchMessageToAllClients(client: Socket, message: Message): void {
        message.isFromSystem = false;
        message.socketId = client.id;
        const gameRoom = this.getGameRoom(client);
        this.server.to(gameRoom).emit('messageFromServer', message);
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
