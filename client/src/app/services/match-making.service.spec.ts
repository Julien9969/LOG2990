/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
import { TestBed } from '@angular/core/testing';
import { SocketClientService } from '@app/services/socket-client.service';
import { SocketTestHelper } from '@common/socket-test-helper';
import { Socket } from 'socket.io-client';
import { MatchMakingService } from './match-making.service';

class SocketClientServiceMock extends SocketClientService {
    override connect() {}
}

describe('MatchMakingService', () => {
    let service: MatchMakingService;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock['socket'] = socketHelper as unknown as Socket;
        TestBed.configureTestingModule({
            providers: [{ provide: SocketClientService, useValue: socketServiceMock }],
        });
        service = TestBed.inject(MatchMakingService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('connect should call socketService.connect if socketService.isSocketAlive return false', () => {
        const connectSpy = spyOn(service['socketService'], 'connect');
        spyOn(service['socketService'], 'isSocketAlive').and.returnValue(false);
        service.connect();
        expect(connectSpy).toHaveBeenCalled();
    });

    it('connect should not call socketService.connect if socketService.isSocketAlive return true', () => {
        const connectSpy = spyOn(service['socketService'], 'connect');
        spyOn(service['socketService'], 'isSocketAlive').and.returnValue(true);
        service.connect();
        expect(connectSpy).not.toHaveBeenCalled();
    });

    it('startMatchmaking should call socketService.send with "startMatchmaking" and a gameId', () => {
        const sendSpy = spyOn(service['socketService'], 'send');
        const gameId = '42';
        service.startMatchmaking(gameId);
        expect(sendSpy).toHaveBeenCalled();
        expect(sendSpy).toHaveBeenCalledWith('startMatchmaking', gameId);
    });

    it('someOneWaiting should call socketService.sendAndCallBack with "someOneWaiting" and a gameId then return a Promise', async () => {
        const expectedResponse = true;
        const sendAndCallbackSpy = spyOn(service['socketService'], 'sendAndCallBack');
        sendAndCallbackSpy.and.callFake((_eventName, _playerName, callback: (response: any) => void) => {
            callback(expectedResponse);
        });
        const gameId = '42';
        const response = await service.someOneWaiting(gameId);
        expect(sendAndCallbackSpy).toHaveBeenCalled();
        expect(sendAndCallbackSpy).toHaveBeenCalledWith('someOneWaiting', gameId, jasmine.any(Function));
        expect(response).toEqual(expectedResponse);
    });

    it('roomCreatedForThisGame should call sendAndCallBack with "roomCreatedForThisGame" and gameId then return a Promise', async () => {
        const expectedResponse = true;
        const sendAndCallbackSpy = spyOn(service['socketService'], 'sendAndCallBack');
        sendAndCallbackSpy.and.callFake((_eventName, _playerName, callback: (response: any) => void) => {
            callback(expectedResponse);
        });
        const gameId = '42';
        const response = await service.roomCreatedForThisGame(gameId);
        expect(sendAndCallbackSpy).toHaveBeenCalled();
        expect(sendAndCallbackSpy).toHaveBeenCalledWith('roomCreatedForThisGame', gameId, jasmine.any(Function));
        expect(response).toEqual(expectedResponse);
    });

    it('opponentJoined should call socketService.on with "opponentJoined" and a callback', () => {
        const callbackSpy = jasmine.createSpy('callback');
        service.opponentJoined(callbackSpy);
        socketHelper.peerSideEmit('opponentJoined', 'playerName');
        expect(callbackSpy).toHaveBeenCalled();
        expect(callbackSpy).toHaveBeenCalledWith('playerName');
    });

    it('opponentLeft should call socketService.on with "opponentLeft" and a callback', () => {
        const callbackSpy = jasmine.createSpy('callback');
        service.opponentLeft(callbackSpy);
        socketHelper.peerSideEmit('opponentLeft');
        expect(callbackSpy).toHaveBeenCalled();
    });

    it('joinRoom should call socketService.send with "joinRoom" and an objet with gameId and playerName', () => {
        const sendSpy = spyOn(service['socketService'], 'send');
        const gameId = '42';
        const playerName = 'playerName';
        service.joinRoom(gameId, playerName);
        expect(sendSpy).toHaveBeenCalled();
        expect(sendSpy).toHaveBeenCalledWith('joinRoom', { gameId, playerName });
    });

    it('iVeBeenAccepted should call socketService.on with "acceptOtherPlayer" and a callback', () => {
        const callbackSpy = jasmine.createSpy('callback');
        service.iVeBeenAccepted(callbackSpy);
        socketHelper.peerSideEmit('acceptOtherPlayer', 'playerName');
        expect(callbackSpy).toHaveBeenCalled();
        expect(callbackSpy).toHaveBeenCalledWith('playerName');
    });

    it('iVeBeenRejected should call socketService.on with "rejectOtherPlayer" and a callback', () => {
        const callbackSpy = jasmine.createSpy('callback');
        service.iVeBeenRejected(callbackSpy);
        socketHelper.peerSideEmit('rejectOtherPlayer', 'playerName');
        expect(callbackSpy).toHaveBeenCalled();
        expect(callbackSpy).toHaveBeenCalledWith('playerName');
    });

    it('roomReachable should call socketService.on with "roomReachable" and a callback', () => {
        const callbackSpy = jasmine.createSpy('callback');
        service.roomReachable(callbackSpy);
        socketHelper.peerSideEmit('roomReachable');
        expect(callbackSpy).toHaveBeenCalled();
    });

    it('sessionIdReceived should call socketService.on with "sessionId" and a callback', () => {
        const callbackSpy = jasmine.createSpy('callback');
        service.sessionIdReceived(callbackSpy);
        socketHelper.peerSideEmit('sessionId', 'sessionId');
        expect(callbackSpy).toHaveBeenCalled();
        expect(callbackSpy).toHaveBeenCalledWith('sessionId');
    });

    it('acceptOpponent should call sendAndCallBack with "acceptOpponent" and a playerName and return a Promise<boolean>', async () => {
        const playerName = 'playerName';
        const expectedResponse = true;
        const sendAndCallbackSpy = spyOn(service['socketService'], 'sendAndCallBack');
        sendAndCallbackSpy.and.callFake((_eventName, _playerName, callback: (response: any) => void) => {
            callback(expectedResponse);
        });
        const response = await service.acceptOpponent(playerName);
        expect(sendAndCallbackSpy).toHaveBeenCalled();
        expect(sendAndCallbackSpy).toHaveBeenCalledWith('acceptOpponent', playerName, jasmine.any(Function));
        expect(response).toEqual(expectedResponse);
    });

    it('rejectOpponent should call socketService.send with "rejectOpponent" and a playerName, gameId object', () => {
        const sendSpy = spyOn(service['socketService'], 'send');
        const playerName = 'playerName';
        const gameId = '42';
        service.rejectOpponent(gameId, playerName);
        expect(sendSpy).toHaveBeenCalled();
        expect(sendSpy).toHaveBeenCalledWith('rejectOpponent', { gameId, playerName });
    });

    it('leaveWaiting should call socketService.send with "leaveWaiting" and a gameId', () => {
        const sendSpy = spyOn(service['socketService'], 'send');
        const gameId = '42';
        service.leaveWaiting(gameId);
        expect(sendSpy).toHaveBeenCalled();
        expect(sendSpy).toHaveBeenCalledWith('leaveWaitingRoom', gameId);
    });

    it('startMultiSession should call socketService.send with "startMultiSession" and a data', () => {
        const sendSpy = spyOn(service['socketService'], 'send');
        const gameId = '213';
        const data = { gameId, isSolo: false };
        service.startMultiSession(gameId);
        expect(sendSpy).toHaveBeenCalled();
        expect(sendSpy).toHaveBeenCalledWith('startSession', data);
    });

    it('startSoloSession should call socketService.send with "startSoloSession" and a data', () => {
        const sendSpy = spyOn(service['socketService'], 'sendAndCallBack');
        const gameId = '213';
        const data = { gameId, isSolo: true };
        service.startSoloSession(gameId, () => {});
        expect(sendSpy).toHaveBeenCalled();
        expect(sendSpy).toHaveBeenCalledWith('startSession', data, jasmine.any(Function));
    });

    it('updateRoomView should call socketService.on with "updateRoomView" and a callback', () => {
        const callbackSpy = jasmine.createSpy('callback');
        service.updateRoomView(callbackSpy);
        socketHelper.peerSideEmit('updateRoomView');
        expect(callbackSpy).toHaveBeenCalled();
    });

    it('gameDeleted should call socketService.on with "gameDeleted" and a callback', () => {
        const callbackSpy = jasmine.createSpy('callback');
        service.gameDeleted(callbackSpy);
        socketHelper.peerSideEmit('gameDeleted');
        expect(callbackSpy).toHaveBeenCalled();
    });
});
