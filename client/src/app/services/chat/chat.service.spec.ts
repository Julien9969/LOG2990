import { TestBed } from '@angular/core/testing';
import { Message } from '@common/message';
import { SocketClientService } from '../socket-client/socket-client.service';
import { ChatService } from './chat.service';

describe('chatService', () => {
    let service: ChatService;
    let socketClientSpy: jasmine.SpyObj<SocketClientService>;

    const exampleName = 'michel';
    const exampleTime = 12;
    const exampleMessage: Message = { author: 'asdasd', isFromSystem: false, sessionID: 123, socketId: 'unknown', time: 34124, message: 'salut' };

    beforeEach(() => {
        socketClientSpy = jasmine.createSpyObj('SocketClientService', ['send', 'on', 'isSocketAlive', 'connect', 'disconnect', 'sendAndCallBack']);

        TestBed.configureTestingModule({
            providers: [{ provide: SocketClientService, useValue: socketClientSpy }],
        });
        service = TestBed.inject(ChatService);
    });

    it('should be defined', () => {
        expect(service).toBeTruthy();
    });

    it('giveNameToServer should call socketService.send with the correct name', () => {
        service.giveNameToServer(exampleName);
        expect(socketClientSpy.send).toHaveBeenCalledWith('giveName', exampleName);
    });

    it('readSystemMessage should accept the mistakeGuessCode', () => {
        const result = service.readSystemMessage('guess_bad', exampleName);
        expect(result).toEqual('Erreur par ' + exampleName);
    });

    it('readSystemMessage should accept the sucessFullGuessCode', () => {
        const result = service.readSystemMessage('guess_good', exampleName);
        expect(result).toEqual('Différence trouvée par ' + exampleName);
    });

    it('readSystemMessage should accept the mistakeGuessCode', () => {
        const result = service.readSystemMessage('userDisconnected', exampleName);
        expect(result).toEqual(exampleName + 'a abandonné la partie.');
    });

    it('readSystemMessage should accept the mistakeGuessCode', () => {
        const result = service.readSystemMessage('invalidCode', exampleName);
        expect(result).toEqual('invalid system error');
    });

    it('createSystemMessage should create a message with the correct values', () => {
        const spy1 = spyOn(Date.prototype, 'getTime').and.callFake(() => {
            return exampleTime;
        });
        const spy2 = spyOn(service, 'readSystemMessage').and.callFake(() => {
            return exampleName;
        });
        const message = service.createSystemMessage('exampleCode', exampleName);
        expect(message.author).toEqual('System');
        expect(message.isFromSystem).toEqual(true);
        expect(message.message).toEqual(exampleName);
        expect(message.time).toEqual(exampleTime);
        expect(spy1).toHaveBeenCalled();
        expect(spy2).toHaveBeenCalled();
    });

    it('sendMessage should call sendMessage', () => {
        service.sendMessage(exampleMessage);
        expect(socketClientSpy.send).toHaveBeenCalled();
    });

    it('receiveMessage should add the message to the list of message and scroll to bottom', () => {
        const spy = spyOn(service, 'scrollToBottom');
        service.receiveMessage(exampleMessage);
        expect(service.messageList).toContain(exampleMessage);
        expect(spy).toHaveBeenCalled();
    });

    it('listenForSystemMessage should call socketService.on()', () => {
        service.listenForSystemMessage();
        expect(socketClientSpy.on).toHaveBeenCalled();
    });

    it('listenForSystemMessage should call receiveMessage in a callback', () => {
        const receiveMessageSpy = spyOn(service, 'receiveMessage');
        service.listenForMessage();
        socketClientSpy.on.calls.mostRecent().args[1](exampleMessage);
        expect(receiveMessageSpy).toHaveBeenCalled();
    });

    it('isFromMe should return true if the provided message has the same socketId', () => {
        service.clientId = '1234';
        const messageSame = exampleMessage;
        messageSame.socketId = '1234';
        const result: boolean = service.isFromMe(messageSame);
        expect(result).toEqual(true);
    });

    it('isFromMe should return false if the provided message doesnt have the same socketId', () => {
        service.clientId = '1234';
        const messageDifferent = exampleMessage;
        exampleMessage.socketId = '3213';
        const result: boolean = service.isFromMe(messageDifferent);
        expect(result).toEqual(false);
    });

    it('scrollToBottom should call scrollIntoView', () => {
        const func: () => void = () => {
            return;
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formElement: any = { nativeElement: { scrollIntoView: func } };
        service.formElement = formElement;
        const spy = spyOn(service.formElement.nativeElement, 'scrollIntoView').and.callFake(() => {
            return;
        });
        service.scrollToBottom();
        expect(spy).toHaveBeenCalled();
    });

    it('listenForSystemMessage should call receiveMessage in a callback', () => {
        const receiveMessageSpy = spyOn(service, 'receiveMessage');
        service.listenForSystemMessage();
        socketClientSpy.on.calls.mostRecent().args[1](exampleMessage);
        expect(receiveMessageSpy).toHaveBeenCalled();
    });

    it('listenForId should set the clientId', () => {
        service.listenForId();
        socketClientSpy.on.calls.mostRecent().args[1]('1234');
        expect(service.clientId).toEqual('1234');
    });
});
