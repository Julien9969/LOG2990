/* eslint-disable @typescript-eslint/no-empty-function */
import { fakeAsync, TestBed } from '@angular/core/testing';
import { MatchMakingService } from './match-making.service';
import { SocketClientService } from '@app/services/socket-client.service';

describe('MatchMakingService', () => {
    let service: MatchMakingService;
    let socketServiceSpy: jasmine.SpyObj<SocketClientService>;

    beforeEach(async () => {
        socketServiceSpy = jasmine.createSpyObj('SocketClientService', ['send', 'on', 'sendAndCallBack', 'connect', 'isSocketAlive']);

        TestBed.configureTestingModule({
            providers: [{ provide: SocketClientService, useValue: socketServiceSpy }],
        });
        service = TestBed.inject(MatchMakingService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('startMatchmaking should call socketService.send with "startMatchmaking" and a gameId', () => {
        const gameId = 42;
        service.startMatchmaking(gameId);
        expect(socketServiceSpy.send).toHaveBeenCalled();
        expect(socketServiceSpy.send).toHaveBeenCalledWith('startMatchmaking', gameId);
    });

    it('someOneWaiting should call socketService.sendAndCallBack with "someOneWaiting" and a gameId then return a Promise', fakeAsync(() => {
        const gameId = 42;

        socketServiceSpy.sendAndCallBack.and.callFake(() => {
            Promise.resolve(true);
        });
        service.someOneWaiting(gameId);
        expect(socketServiceSpy.sendAndCallBack).toHaveBeenCalled();
        expect(socketServiceSpy.sendAndCallBack).toHaveBeenCalledWith('someOneWaiting', gameId, jasmine.any(Function));
    }));

    it('opponentJoined should call socketService.on with "opponentJoined" and a callback', () => {
        service.opponentJoined(() => {});
        expect(socketServiceSpy.on).toHaveBeenCalled();
        expect(socketServiceSpy.on).toHaveBeenCalledWith('opponentJoined', jasmine.any(Function));
    });

    it('joinRoom should call socketService.send with "joinRoom" and an objet with gameId and playerName', () => {
        const gameId = 42;
        const playerName = 'playerName';
        service.joinRoom(gameId, playerName);
        expect(socketServiceSpy.send).toHaveBeenCalled();
        expect(socketServiceSpy.send).toHaveBeenCalledWith('joinRoom', { gameId, playerName });
    });

    it('iveBeenAccepted should call socketService.on with "acceptOtherPlayer" and a callback', () => {
        service.iVeBeenAccepted(() => {});
        expect(socketServiceSpy.on).toHaveBeenCalled();
        expect(socketServiceSpy.on).toHaveBeenCalledWith('acceptOtherPlayer', jasmine.any(Function));
    });

    it('iVeBeenRejected should call socketService.on with "rejectOtherPlayer" and a callback', () => {
        service.iVeBeenRejected(() => {});
        expect(socketServiceSpy.on).toHaveBeenCalled();
        expect(socketServiceSpy.on).toHaveBeenCalledWith('rejectOtherPlayer', jasmine.any(Function));
    });

    it('sessionIdReceived should call socketService.on with "sessionId" and a callback', () => {
        service.sessionIdReceived(() => {});
        expect(socketServiceSpy.on).toHaveBeenCalled();
        expect(socketServiceSpy.on).toHaveBeenCalledWith('sessionId', jasmine.any(Function));
    });

    it('acceptOpponent should call sendAndCallBack with "acceptOpponent" and a playerName and return a Promise<boolean>', fakeAsync(() => {
        const playerName = 'playerName';

        socketServiceSpy.sendAndCallBack.and.callFake(() => {
            Promise.resolve();
        });
        service.acceptOpponent(playerName);
        expect(socketServiceSpy.sendAndCallBack).toHaveBeenCalled();
        expect(socketServiceSpy.sendAndCallBack).toHaveBeenCalledWith('acceptOpponent', playerName, jasmine.any(Function));
    }));

    it('rejectOpponent should call socketService.send with "rejectOpponent" and an objet with gameId and playerName', () => {
        const gameId = 42;
        const playerName = 'playerName';
        service.rejectOpponent(gameId, playerName);
        expect(socketServiceSpy.send).toHaveBeenCalled();
        expect(socketServiceSpy.send).toHaveBeenCalledWith('rejectOpponent', { gameId, playerName });
    });

    it('leaveWaiting should call socketService.send with "leaveWaitingRoom" and a gameId', () => {
        const gameId = 42;
        service.leaveWaiting(gameId);
        expect(socketServiceSpy.send).toHaveBeenCalled();
        expect(socketServiceSpy.send).toHaveBeenCalledWith('leaveWaitingRoom', gameId);
    });

    it('askForSessionId should call socketService.send with "askForSessionId" and a gameId', () => {
        const gameId = 42;
        service.askForSessionId(gameId);
        expect(socketServiceSpy.send).toHaveBeenCalled();
        expect(socketServiceSpy.send).toHaveBeenCalledWith('askForSessionId', gameId);
    });

    it('connect should not call socketService.connect and configureBaseFeatures if socketService.IsSocketAlive return true', () => {
        socketServiceSpy.isSocketAlive.and.returnValue(true);
        spyOn(service, 'configureBaseFeatures');
        service.connect();
        expect(socketServiceSpy.connect).not.toHaveBeenCalled();
        expect(service.configureBaseFeatures).not.toHaveBeenCalled();
    });

    it('connect should call socketService.connect and configureBaseFeatures if socketService.IsSocketAlive return false', () => {
        spyOn(service, 'configureBaseFeatures');
        socketServiceSpy.isSocketAlive.and.returnValue(false);
        service.connect();
        expect(socketServiceSpy.connect).toHaveBeenCalled();
        expect(service.configureBaseFeatures).toHaveBeenCalled();
    });

    it('configureBaseFeatures should call socketService.on with "opponentLeftGame" and a callback', () => {
        service.configureBaseFeatures();
        expect(socketServiceSpy.on).toHaveBeenCalled();
        expect(socketServiceSpy.on).toHaveBeenCalledWith('opponentLeftGame', jasmine.any(Function));
    });
});
