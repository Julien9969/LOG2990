import { ElementRef, Injectable } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client.service';
import { Message } from '@common/message';
import { SystemMessage } from '@common/systemMessage';
import { SystemCode } from './constantes.service';
@Injectable({
    providedIn: 'root',
})
export class ChatService {
    messageList: Message[];
    formElement: ElementRef<HTMLFormElement>;
    clientId: string;

    constructor(public socketService: SocketClientService) {
        this.start();
    }
    start() {
        this.messageList = [];
        this.connect();
        this.listenForMessage();
        this.listenForSystemMessage();
        this.listenForId();
    }

    giveNameToServer(playerName: string) {
        this.socketService.send('giveName', playerName);
    }
    readSystemMessage(systemCode: string, playerName: string): string {
        switch (systemCode) {
            case SystemCode.MistakeGuess:
                return 'Erreur par ' + playerName;
            case SystemCode.SuccessFullGuess:
                return 'Différence trouvée par ' + playerName;
            case SystemCode.UserDisconnected:
                return playerName + 'a abandonné la partie.';
        }
        return 'invalid system error';
    }
    createSystemMessage(systemCode: string, playerName: string): Message {
        return {
            author: 'System',
            isFromSystem: true,
            socketId: 'unknown',
            sessionID: -1,
            time: new Date().getTime(),
            message: this.readSystemMessage(systemCode, playerName),
        };
    }
    isFromMe(message: Message): boolean {
        return message.socketId === this.clientId;
    }

    sendMessage(message: Message) {
        this.socketService.send('messageFromClient', message);
    }

    receiveMessage(message: Message) {
        this.messageList.push(message);
        this.scrollToBottom();
    }
    scrollToBottom() {
        this.formElement.nativeElement.scrollIntoView();
    }
    async listenForSystemMessage() {
        this.socketService.on('systemMessageFromServer', (systemMessage: SystemMessage) => {
            this.receiveMessage(this.createSystemMessage(systemMessage.systemCode, systemMessage.playerName));
        });
    }

    async listenForMessage() {
        this.socketService.on('messageFromServer', (newMessage: Message) => {
            this.receiveMessage(newMessage);
        });
    }
    async listenForId() {
        this.socketService.on('giveClientID', (receivedId: string) => {
            this.clientId = receivedId;
        });
    }
    connect() {
        if (!this.socketService.isSocketAlive()) {
            this.socketService.connect();
        }
    }
}
