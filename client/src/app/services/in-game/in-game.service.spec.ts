/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
import { TestBed } from '@angular/core/testing';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { Clue } from '@common/clue';
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

    // it('submitCoordinates should send get the right callback', async () => {
    //     const sessionId = 123;
    //     const coordinate = { x: 0, y: 0 };
    //     const expectedResponse: GuessResult = {
    //         isCorrect: true,
    //         differencesByPlayer: [],
    //         differencePixelList: [],
    //         winnerName: '',
    //     };
    //     const sendAndCallbackSpy = spyOn(service['socketService'], 'sendAndCallBack');
    //     sendAndCallbackSpy.and.callFake((_eventName, _playerName, callback: (response: any) => void) => {
    //         callback(expectedResponse);
    //     });
    //     const response = await service.submitCoordinates(sessionId, coordinate);
    //     expect(sendAndCallbackSpy).toHaveBeenCalled();
    //     expect(sendAndCallbackSpy).toHaveBeenCalledWith(SessionEvents.SubmitCoordinates, [sessionId, coordinate], jasmine.any(Function));
    //     expect(response).toEqual(expectedResponse);
    // });

    it('retrieveClue should send get the right callback', async () => {
        const expectedResponse = {
            coordinates: [{ x: 0, y: 0 }],
            nbCluesLeft: 2,
        } as Clue;

        const sendAndCallbackSpy = spyOn(service['socketService'], 'sendAndCallBack');
        sendAndCallbackSpy.and.callFake((_eventName, _playerName, callback: (response: any) => void) => {
            callback(expectedResponse);
        });

        const clue = await service.retrieveClue();
        expect(sendAndCallbackSpy).toHaveBeenCalled();
        expect(sendAndCallbackSpy).toHaveBeenCalledWith(SessionEvents.AskForClue, undefined, jasmine.any(Function));
        expect(clue).toEqual(expectedResponse);
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

    it('cheatGetAllDifferences should call socketService.sendAndCallBack with a callback', () => {
        const sendAndCallbackSpy = spyOn(service['socketService'], 'sendAndCallBack');
        service.cheatGetAllDifferences(1);
        sendAndCallbackSpy.calls.mostRecent().args[2]([]);
        expect(sendAndCallbackSpy).toHaveBeenCalled();
        expect(sendAndCallbackSpy).toHaveBeenCalledWith(SessionEvents.CheatGetAllDifferences, 1, jasmine.any(Function));
    });
});
