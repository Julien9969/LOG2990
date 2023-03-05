import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
// TODO : DELETE
// import { ChatGateway } from '../chat/chat.gateway';
// import { MatchmakingGateway } from './match-making/match-making.gateway';
// import { SessionGateway } from './session/session.gateway';

@WebSocketGateway({ cors: true })
@Injectable()
export class MainGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    @WebSocketServer() private server: Server;
    // TODO : DELETE
    // chatGateway: ChatGateway;
    // matchMaking: MatchmakingGateway;
    // session: SessionGateway;
    constructor(private readonly logger: Logger) {}
    //     // this.chatGateway = new ChatGateway(this.server);
    //     // this.matchMaking = new MatchmakingGateway(this.server);
    //     // this.session = new SessionGateway(this.server);
    // }

    afterInit() {
        this.logger.log('Main gateway initialized');
    }

    handleConnection(client: Socket) {
        this.logger.log('New client connected : ' + client.id);
        this.server.emit('newClientConnected Main', client.id);
    }

    handleDisconnect(client: Socket) {
        this.logger.log('Client disconnected : ' + client.id);
    }
}
