/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
import { TestBed } from '@angular/core/testing';
import { SocketClientService } from '@app/services/socket-client.service';
import { GuessResult } from '@common/guess-result';
import { SessionEvents } from '@common/session.gateway.events';
import { SocketTestHelper } from '@common/socket-test-helper';
import { WinnerInfo } from '@common/winner-info';
import { Socket } from 'socket.io-client';
import { InGameService } from './in-game.service';

class SocketClientServiceMock extends SocketClientService {
    override connect() {}
}

describe('InGameService', () => {
    let service: InGameService;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock['socket'] = socketHelper as unknown as Socket;
        TestBed.configureTestingModule({
            providers: [{ provide: SocketClientService, useValue: socketServiceMock }],
        });
        service = TestBed.inject(InGameService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('submitCoordinates should send get the right callback', async () => {
        const sessionId = 123;
        const coordinate = { x: 0, y: 0 };
        const expectedResponse: GuessResult = {
            isCorrect: true,
            differencesByPlayer: [],
            differencePixelList: [],
            winnerName: '',
        };
        const sendAndCallbackSpy = spyOn(service['socketService'], 'sendAndCallBack');
        sendAndCallbackSpy.and.callFake((_eventName, _playerName, callback: (response: any) => void) => {
            callback(expectedResponse);
        });
        const response = await service.submitCoordinates(sessionId, coordinate);
        expect(sendAndCallbackSpy).toHaveBeenCalled();
        expect(sendAndCallbackSpy).toHaveBeenCalledWith(SessionEvents.SubmitCoordinates, [sessionId, coordinate], jasmine.any(Function));
        expect(response).toEqual(expectedResponse);
    });
    it('retrieveSocketId should send get the right callback', async () => {
        const expectedResponse = 'socketId';
        const sendAndCallbackSpy = spyOn(service['socketService'], 'sendAndCallBack');
        sendAndCallbackSpy.and.callFake((_eventName, _playerName, callback: (response: any) => void) => {
            callback(expectedResponse);
        });
        const response = await service.retrieveSocketId();
        expect(sendAndCallbackSpy).toHaveBeenCalled();
        expect(sendAndCallbackSpy).toHaveBeenCalledWith(SessionEvents.GetClientId, undefined, jasmine.any(Function));
        expect(response).toEqual(expectedResponse);
    });
    describe('disconnect', () => {
        it('should call socket.disconnect when socket alive', () => {
            const socketAliveSpy = spyOn(service['socketService'], 'isSocketAlive').and.callFake(() => {
                return true;
            });
            const socketDisconnectSpy = spyOn(service['socketService'], 'disconnect').and.callFake(() => {});
            service.disconnect();
            expect(socketAliveSpy).toHaveBeenCalled();
            expect(socketDisconnectSpy).toHaveBeenCalled();
        });
        it('should not call socket.disconnect when socket is not alive', () => {
            const socketAliveSpy = spyOn(service['socketService'], 'isSocketAlive').and.callFake(() => {
                return false;
            });
            const socketDisconnectSpy = spyOn(service['socketService'], 'disconnect').and.callFake(() => {});
            service.disconnect();
            expect(socketAliveSpy).toHaveBeenCalled();
            expect(socketDisconnectSpy).not.toHaveBeenCalled();
        });
    });
    it('playerExited should send the right elements', () => {
        const sessionId = 123;
        const sendSpy = spyOn(service['socketService'], 'send').and.callFake(() => {});
        service.playerExited(sessionId);
        expect(sendSpy).toHaveBeenCalledWith(SessionEvents.PlayerLeft, sessionId);
    });

    it('listenDifferenceFound should callback with the right infos when receiving a certain message', () => {
        const differenceFoundStub: GuessResult = { isCorrect: false, differencesByPlayer: [], differencePixelList: [], winnerName: undefined };
        const callbackSpy = jasmine.createSpy('callback');
        service.listenDifferenceFound(callbackSpy);
        socketHelper.peerSideEmit(SessionEvents.DifferenceFound, differenceFoundStub);
        expect(callbackSpy).toHaveBeenCalled();
        expect(callbackSpy).toHaveBeenCalledWith(differenceFoundStub);
    });
    it('listenOpponentLeaves should callback and call the right function when receiving a certain message', () => {
        const callbackSpy = jasmine.createSpy('callback');
        const disconnectSpy = spyOn(service['socketService'], 'disconnect').and.callFake(() => {});
        service.listenOpponentLeaves(callbackSpy);
        socketHelper.peerSideEmit(SessionEvents.OpponentLeftGame);
        expect(callbackSpy).toHaveBeenCalled();
        expect(disconnectSpy).toHaveBeenCalled();
    });
    it('listenProvideName should send the right message receiving a certain message', () => {
        const playerName = 'jean';
        service.listenProvideName(playerName);
        const sendSpy = spyOn(service['socketService'], 'send').and.callFake(() => {});
        socketHelper.peerSideEmit(SessionEvents.ProvideName);
        expect(sendSpy).toHaveBeenCalledWith(SessionEvents.PlayerName, playerName);
    });
    it('listenTimerUpdate should callback with the right info when receiving a certain message', () => {
        const time = 'time';
        const callbackSpy = jasmine.createSpy('callback');
        service.listenTimerUpdate(callbackSpy);
        socketHelper.peerSideEmit(SessionEvents.TimerUpdate, time);
        expect(callbackSpy).toHaveBeenCalled();
        expect(callbackSpy).toHaveBeenCalledWith(time);
    });
    it('listenPlayerWon should callback with the right info when receiving a certain message', () => {
        const winnerInfo: WinnerInfo = { name: 'name', socketId: 'socketId' };
        const callbackSpy = jasmine.createSpy('callback');
        service.listenPlayerWon(callbackSpy);
        socketHelper.peerSideEmit(SessionEvents.PlayerWon, winnerInfo);
        expect(callbackSpy).toHaveBeenCalled();
        expect(callbackSpy).toHaveBeenCalledWith(winnerInfo);
    });

    // it('connect should call socketService.connect if socketService.isSocketAlive return false', () => {
    //     const connectSpy = spyOn(service['socketService'], 'connect');
    //     spyOn(service['socketService'], 'isSocketAlive').and.returnValue(false);
    //     service.connect();
    //     expect(connectSpy).toHaveBeenCalled();
    // });

    // it('connect should not call socketService.connect if socketService.isSocketAlive return true', () => {
    //     const connectSpy = spyOn(service['socketService'], 'connect');
    //     spyOn(service['socketService'], 'isSocketAlive').and.returnValue(true);
    //     service.connect();
    //     expect(connectSpy).not.toHaveBeenCalled();
    // });

    // it('startMatchmaking should call socketService.send with "startMatchmaking" and a gameId', () => {
    //     const sendSpy = spyOn(service['socketService'], 'send');
    //     const gameId = '42';
    //     service.startMatchmaking(gameId);
    //     expect(sendSpy).toHaveBeenCalled();
    //     expect(sendSpy).toHaveBeenCalledWith('startMatchmaking', gameId);
    // });

    // it('someOneWaiting should call socketService.sendAndCallBack with "someOneWaiting" and a gameId then return a Promise', async () => {
    //     const expectedResponse = true;
    //     const sendAndCallbackSpy = spyOn(service['socketService'], 'sendAndCallBack');
    //     sendAndCallbackSpy.and.callFake((_eventName, _playerName, callback: (response: any) => void) => {
    //         callback(expectedResponse);
    //     });
    //     const gameId = '42';
    //     const response = await service.someOneWaiting(gameId);
    //     expect(sendAndCallbackSpy).toHaveBeenCalled();
    //     expect(sendAndCallbackSpy).toHaveBeenCalledWith('someOneWaiting', gameId, jasmine.any(Function));
    //     expect(response).toEqual(expectedResponse);
    // });

    // it('roomCreatedForThisGame should call sendAndCallBack with "roomCreatedForThisGame" and gameId then return a Promise', async () => {
    //     const expectedResponse = true;
    //     const sendAndCallbackSpy = spyOn(service['socketService'], 'sendAndCallBack');
    //     sendAndCallbackSpy.and.callFake((_eventName, _playerName, callback: (response: any) => void) => {
    //         callback(expectedResponse);
    //     });
    //     const gameId = '42';
    //     const response = await service.roomCreatedForThisGame(gameId);
    //     expect(sendAndCallbackSpy).toHaveBeenCalled();
    //     expect(sendAndCallbackSpy).toHaveBeenCalledWith('roomCreatedForThisGame', gameId, jasmine.any(Function));
    //     expect(response).toEqual(expectedResponse);
    // });

    // it('opponentJoined should call socketService.on with "opponentJoined" and a callback', () => {
    //     const callbackSpy = jasmine.createSpy('callback');
    //     service.opponentJoined(callbackSpy);
    //     socketHelper.peerSideEmit('opponentJoined', 'playerName');
    //     expect(callbackSpy).toHaveBeenCalled();
    //     expect(callbackSpy).toHaveBeenCalledWith('playerName');
    // });

    // it('opponentLeft should call socketService.on with "opponentLeft" and a callback', () => {
    //     const callbackSpy = jasmine.createSpy('callback');
    //     service.opponentLeft(callbackSpy);
    //     socketHelper.peerSideEmit('opponentLeft');
    //     expect(callbackSpy).toHaveBeenCalled();
    // });

    // it('joinRoom should call socketService.send with "joinRoom" and an objet with gameId and playerName', () => {
    //     const sendSpy = spyOn(service['socketService'], 'send');
    //     const gameId = '42';
    //     const playerName = 'playerName';
    //     service.joinRoom(gameId, playerName);
    //     expect(sendSpy).toHaveBeenCalled();
    //     expect(sendSpy).toHaveBeenCalledWith('joinRoom', { gameId, playerName });
    // });

    // it('iVeBeenAccepted should call socketService.on with "acceptOtherPlayer" and a callback', () => {
    //     const callbackSpy = jasmine.createSpy('callback');
    //     service.iVeBeenAccepted(callbackSpy);
    //     socketHelper.peerSideEmit('acceptOtherPlayer', 'playerName');
    //     expect(callbackSpy).toHaveBeenCalled();
    //     expect(callbackSpy).toHaveBeenCalledWith('playerName');
    // });

    // it('iVeBeenRejected should call socketService.on with "rejectOtherPlayer" and a callback', () => {
    //     const callbackSpy = jasmine.createSpy('callback');
    //     service.iVeBeenRejected(callbackSpy);
    //     socketHelper.peerSideEmit('rejectOtherPlayer', 'playerName');
    //     expect(callbackSpy).toHaveBeenCalled();
    //     expect(callbackSpy).toHaveBeenCalledWith('playerName');
    // });

    // it('roomReachable should call socketService.on with "roomReachable" and a callback', () => {
    //     const callbackSpy = jasmine.createSpy('callback');
    //     service.roomReachable(callbackSpy);
    //     socketHelper.peerSideEmit('roomReachable');
    //     expect(callbackSpy).toHaveBeenCalled();
    // });

    // it('sessionIdReceived should call socketService.on with "sessionId" and a callback', () => {
    //     const callbackSpy = jasmine.createSpy('callback');
    //     service.sessionIdReceived(callbackSpy);
    //     socketHelper.peerSideEmit('sessionId', 'sessionId');
    //     expect(callbackSpy).toHaveBeenCalled();
    //     expect(callbackSpy).toHaveBeenCalledWith('sessionId');
    // });

    // it('acceptOpponent should call sendAndCallBack with "acceptOpponent" and a playerName and return a Promise<boolean>', async () => {
    //     const playerName = 'playerName';
    //     const expectedResponse = true;
    //     const sendAndCallbackSpy = spyOn(service['socketService'], 'sendAndCallBack');
    //     sendAndCallbackSpy.and.callFake((_eventName, _playerName, callback: (response: any) => void) => {
    //         callback(expectedResponse);
    //     });
    //     const response = await service.acceptOpponent(playerName);
    //     expect(sendAndCallbackSpy).toHaveBeenCalled();
    //     expect(sendAndCallbackSpy).toHaveBeenCalledWith('acceptOpponent', playerName, jasmine.any(Function));
    //     expect(response).toEqual(expectedResponse);
    // });

    // it('rejectOpponent should call socketService.send with "rejectOpponent" and a playerName, gameId object', () => {
    //     const sendSpy = spyOn(service['socketService'], 'send');
    //     const playerName = 'playerName';
    //     const gameId = '42';
    //     service.rejectOpponent(gameId, playerName);
    //     expect(sendSpy).toHaveBeenCalled();
    //     expect(sendSpy).toHaveBeenCalledWith('rejectOpponent', { gameId, playerName });
    // });

    // it('leaveWaiting should call socketService.send with "leaveWaiting" and a gameId', () => {
    //     const sendSpy = spyOn(service['socketService'], 'send');
    //     const gameId = '42';
    //     service.leaveWaiting(gameId);
    //     expect(sendSpy).toHaveBeenCalled();
    //     expect(sendSpy).toHaveBeenCalledWith('leaveWaitingRoom', gameId);
    // });

    // it('askForSessionId should call socketService.send with "askForSessionId" and a gameId', () => {
    //     const sendSpy = spyOn(service['socketService'], 'send');
    //     const gameId = '42';
    //     // service.askForSessionId(gameId);
    //     expect(sendSpy).toHaveBeenCalled();
    //     expect(sendSpy).toHaveBeenCalledWith('askForSessionId', gameId);
    // });

    // it('updateRoomView should call socketService.on with "updateRoomView" and a callback', () => {
    //     const callbackSpy = jasmine.createSpy('callback');
    //     service.updateRoomView(callbackSpy);
    //     socketHelper.peerSideEmit('updateRoomView');
    //     expect(callbackSpy).toHaveBeenCalled();
    // });
});
