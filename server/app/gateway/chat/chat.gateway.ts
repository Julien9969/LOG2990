import { ChatEvents } from '@common/chat.gateway.events';
import { Message } from '@common/message';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class ChatGateway {
    @WebSocketServer() protected server: Server;

    @SubscribeMessage(ChatEvents.GiveName)
    giveClientId(client: Socket): void {
        client.emit(ChatEvents.GiveClientID, client.id);
    }

    @SubscribeMessage(ChatEvents.MessageFromClient)
    dispatchMessageToAllClients(client: Socket, message: Message): void {
        message.isFromSystem = false;
        message.socketId = client.id;
        this.server.to(this.getGameRoom(client)).emit(ChatEvents.MessageFromServer, message);
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
