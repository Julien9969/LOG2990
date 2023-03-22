import { TestBed } from '@angular/core/testing';
import { Message } from '@common/message';
import { SocketTestHelper } from '@common/socket-test-helper';
import { ChatService } from './chat.service';

describe('chatService', () => {
    let service: ChatService;
    let socketHelper: SocketTestHelper;

    const exampleName = 'michel';
    const exampleTime = 12;
    const exampleMessage: Message = { author: 'asdasd', isFromSystem: false, sessionID: 123, socketId: 'unknown', time: 34124, message: 'salut' };

    beforeEach(() => {
        socketHelper = new SocketTestHelper();

        TestBed.configureTestingModule({
            providers: [],
        });
        service = TestBed.inject(ChatService);
    });

    it('should be defined', () => {
        expect(service).toBeTruthy();
    });

    it('giveNameToServer should call socketservce.sen with the correct name', () => {
        // staging
        const spy = spyOn(service.socketService, 'send').and.callFake((playerName: string) => {
            return;
        });
        // acting
        service.giveNameToServer(exampleName);
        // evaluating
        expect(spy).toHaveBeenCalledWith('giveName', exampleName);
    });

    it('readSystemMessage should accept the mistakeGuessCode', () => {
        // staging

        // acting
        const result = service.readSystemMessage('guess_bad', exampleName);
        // evaluating
        expect(result).toEqual('Erreur par ' + exampleName);
    });

    it('readSystemMessage should accept the sucessFullGuessCode', () => {
        // staging

        // acting
        const result = service.readSystemMessage('guess_good', exampleName);
        // evaluating
        expect(result).toEqual('Différence trouvée par ' + exampleName);
    });

    it('readSystemMessage should accept the mistakeGuessCode', () => {
        // staging

        // acting
        const result = service.readSystemMessage('userDisconnected', exampleName);
        // evaluating
        expect(result).toEqual(exampleName + 'a abandonné la partie.');
    });
    it('readSystemMessage should accept the mistakeGuessCode', () => {
        // staging

        // acting
        const result = service.readSystemMessage('invalidCode', exampleName);
        // evaluating
        expect(result).toEqual('invalid system error');
    });

    it('createSystemMessage should create a message with the correct values', () => {
        // staging
        const spy1 = spyOn(Date.prototype, 'getTime').and.callFake(() => {
            return exampleTime;
        });
        const spy2 = spyOn(service, 'readSystemMessage').and.callFake(() => {
            return exampleName;
        });
        // acting
        const message = service.createSystemMessage('exampleCode', exampleName);
        // evaluating
        expect(message.author).toEqual('System');
        expect(message.isFromSystem).toEqual(true);
        expect(message.message).toEqual(exampleName);
        expect(message.time).toEqual(exampleTime);
        expect(spy1).toHaveBeenCalled();
        expect(spy2).toHaveBeenCalled();
    });

    it('sendMessage should call sendMessage', () => {
        // staging
        const spy = spyOn(service.socketService, 'send').and.callFake(() => {
            return;
        });
        // acting
        service.sendMessage(exampleMessage);
        // evaluating
        expect(spy).toHaveBeenCalled();
    });
    it('receiveMessage should add the message to the list of message and scroll to bottom', () => {
        // staging
        const spy = spyOn(service, 'scrollToBottom');
        // acting
        service.receiveMessage(exampleMessage);
        // evaluating
        expect(service.messageList).toContain(exampleMessage);
        expect(spy).toHaveBeenCalled();
    });

    it('listenForSystemMessage should call socketService.on()', () => {
        // staging
        const spy = spyOn(service.socketService, 'on');
        // acting
        service.listenForSystemMessage();
        // evaluating
        expect(spy).toHaveBeenCalled();
    });
    it('listenForSystemMessage should call socketService.on()', () => {
        // staging
        const spy = spyOn(service.socketService, 'on');
        // acting
        service.listenForMessage();
        // evaluating
        expect(spy).toHaveBeenCalled();
    });
    it('connect should call socketService.connect() if the socket isnt alive', () => {
        // staging
        spyOn(service.socketService, 'isSocketAlive').and.callFake(() => {
            return false;
        });
        const spy = spyOn(service.socketService, 'connect');
        // acting
        service.connect();
        // evaluating
        expect(spy).toHaveBeenCalled();
    });
    it('connect shouldnt call socketService.connect() if the socket is already alive', () => {
        // staging
        spyOn(service.socketService, 'isSocketAlive').and.callFake(() => {
            return true;
        });
        const spy = spyOn(service.socketService, 'connect');
        // acting
        service.connect();
        // evaluating
        expect(spy).not.toHaveBeenCalled();
    });
    it('isFromMe should return true if the provided message has the same socketId', () => {
        // staging
        service.clientId = '1234';
        const messageSame = exampleMessage;
        messageSame.socketId = '1234';
        // acting
        const result: boolean = service.isFromMe(messageSame);
        // evaluating
        expect(result).toEqual(true);
    });
    it('isFromMe should return false if the provided message doesnt have the same socketId', () => {
        // staging
        service.clientId = '1234';
        const messageDifferent = exampleMessage;
        exampleMessage.socketId = '3213';
        // acting
        const result: boolean = service.isFromMe(messageDifferent);
        // evaluating
        expect(result).toEqual(false);
    });
    it('scrollToBottom should call scrollIntoView', () => {
        // staging
        const func: () => void = () => {
            return;
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formElement: any = { nativeElement: { scrollIntoView: func } };
        service.formElement = formElement;
        const spy = spyOn(service.formElement.nativeElement, 'scrollIntoView').and.callFake(() => {
            return;
        });
        // acting
        service.scrollToBottom();
        // evaluating
        expect(spy).toHaveBeenCalled();
    }); /*
    it('listenToSystemMessage should call socketService.on', () => {
        // staging
        // const spy1 =
        spyOn(service.socketService, 'on');
        const spy2 = spyOn(service, 'receiveMessage');
        // const spy3 = spyOn(service, 'createSystemMessage');
        // acting

        // service.start();
        service.listenForSystemMessage();
        socketHelper.peerSideEmit('systemMessageFromServer', {});
        // evaluating
        // expect(spy1).toHaveBeenCalled();
        expect(spy2).toHaveBeenCalled();
        // expect(spy3).toHaveBeenCalled();
    });
    it('listenForId should call socketService.on', () => {
        // staging
        const spy1 = spyOn(service.socketService, 'on');
        // acting
        service.listenForId();
        // evaluating
        expect(spy1).toHaveBeenCalled();
    });*/
});
