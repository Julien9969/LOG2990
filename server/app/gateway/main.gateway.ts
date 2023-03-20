import { SessionService } from '@app/services/session/session.service';
import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class MainGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    @WebSocketServer() private server: Server;
    constructor(private readonly logger: Logger, private readonly sessionService: SessionService) {}

    afterInit() {
        this.logger.log('Main gateway initialized');
    }

    handleConnection(client: Socket) {
        this.logger.log('New client connected : ' + client.id);
    }

    handleDisconnect(client: Socket) {
        this.logger.log('Client disconnected : ' + client.id);
        try {
            const session = this.sessionService.findByCliendId(client.id);
            if (!session) return;
            this.sessionService.delete(session.id);
            this.logger.log(`Session with client ${client.id} has been deleted`);
        } catch (error) {
            this.logger.error(error);
        }
    }
}
