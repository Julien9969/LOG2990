import { ElementRef, Injectable } from '@angular/core';
import { SystemCode } from '@app/services/constantes.service';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { ChatEvents } from '@common/chat.gateway.events';
import { Message } from '@common/message';
import { SessionEvents } from '@common/session.gateway.events';
import { SystemMessage } from '@common/systemMessage';
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
        this.listenForMessage();
        this.listenForSystemMessage();
        this.listenForId();
    }

    giveNameToServer(playerName: string) {
        this.socketService.send(SessionEvents.GiveName, playerName);
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
        this.socketService.send(ChatEvents.MessageFromClient, message);
    }

    receiveMessage(message: Message) {
        this.messageList.push(message);
        this.scrollToBottom();
    }
    scrollToBottom() {
        this.formElement.nativeElement.scrollIntoView();
    }
    async listenForSystemMessage() {
        this.socketService.on(ChatEvents.SystemMessageFromServer, (systemMessage: SystemMessage) => {
            this.receiveMessage(this.createSystemMessage(systemMessage.systemCode, systemMessage.playerName));
        });
    }

    async listenForMessage() {
        this.socketService.on(ChatEvents.MessageFromServer, (newMessage: Message) => {
            this.receiveMessage(newMessage);
        });
    }
    async listenForId() {
        this.socketService.on(ChatEvents.GiveClientID, (receivedId: string) => {
            this.clientId = receivedId;
        });
    }
}
