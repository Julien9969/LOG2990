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

describe('InGameService', () => {
    let service: InGameService;
    let socketServiceSpy: jasmine.SpyObj<SocketClientService>;
    let socketHelper: SocketTestHelper;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketServiceSpy = jasmine.createSpyObj('SocketClientService', ['connect', 'disconnect', 'on', 'sendAndCallBack', 'send', 'isSocketAlive']);
        socketServiceSpy['socket'] = socketHelper as unknown as Socket;

        socketServiceSpy.on.and.callFake((event: string, action: (data: any) => void): any => {
            socketHelper.on(event, action as any);
        });

        TestBed.configureTestingModule({
            providers: [{ provide: SocketClientService, useValue: socketServiceSpy }],
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
        socketServiceSpy.sendAndCallBack.and.callFake((_eventName, _playerName, callback: (response: any) => void) => {
            callback(expectedResponse);
        });
        const response = await service.submitCoordinatesSolo(sessionId, coordinate);
        expect(socketServiceSpy.sendAndCallBack).toHaveBeenCalled();
        expect(socketServiceSpy.sendAndCallBack).toHaveBeenCalledWith(
            SessionEvents.SubmitCoordinatesSoloGame,
            [sessionId, coordinate],
            jasmine.any(Function),
        );
        expect(response).toEqual(expectedResponse);
    });

    it('submitCoordinatesMulti should call send with data and SessionEvents.SubmitCoordinatesMultiGame', async () => {
        const sessionId = 123;
        const coordinate = { x: 0, y: 0 };
        service.submitCoordinatesMulti(sessionId, coordinate);
        expect(socketServiceSpy.send).toHaveBeenCalled();
        expect(socketServiceSpy.send).toHaveBeenCalledWith(SessionEvents.SubmitCoordinatesMultiGame, [sessionId, coordinate]);
    });

    it('submitCoordinatesLimitedTime should call send with data and SessionEvents.SubmitCoordinatesLimitedTime', async () => {
        const sessionId = 123;
        const coordinate = { x: 0, y: 0 };
        service.submitCoordinatesLimitedTime(sessionId, coordinate);
        expect(socketServiceSpy.send).toHaveBeenCalledWith(SessionEvents.SubmitCoordinatesLimitedTime, [sessionId, coordinate]);
    });

    it('retrieveClue should send get the right callback', async () => {
        const expectedResponse = {
            coordinates: [{ x: 0, y: 0 }],
            nbCluesLeft: 2,
        } as Clue;

        socketServiceSpy.sendAndCallBack.and.callFake((_eventName, _playerName, callback: (response: any) => void) => {
            callback(expectedResponse);
        });

        const clue = await service.retrieveClue();
        expect(socketServiceSpy.sendAndCallBack).toHaveBeenCalled();
        expect(socketServiceSpy.sendAndCallBack).toHaveBeenCalledWith(SessionEvents.AskForClue, undefined, jasmine.any(Function));
        expect(clue).toEqual(expectedResponse);
    });

    it('retrieveSocketId should send get the right callback', async () => {
        const expectedResponse = 'socketId';
        socketServiceSpy.sendAndCallBack.and.callFake((_eventName, _playerName, callback: (response: any) => void) => {
            callback(expectedResponse);
        });
        const response = await service.retrieveSocketId();
        expect(socketServiceSpy.sendAndCallBack).toHaveBeenCalled();
        expect(socketServiceSpy.sendAndCallBack).toHaveBeenCalledWith(SessionEvents.GetClientId, undefined, jasmine.any(Function));
        expect(response).toEqual(expectedResponse);
    });
    describe('disconnect', () => {
        it('should call socket.disconnect when socket alive', () => {
            socketServiceSpy.isSocketAlive.and.callFake(() => {
                return true;
            });
            socketServiceSpy.disconnect.and.callFake(() => {});
            service.disconnect();
            expect(socketServiceSpy.isSocketAlive).toHaveBeenCalled();
            expect(socketServiceSpy.disconnect).toHaveBeenCalled();
        });
        it('should not call socket.disconnect when socket is not alive', () => {
            socketServiceSpy.isSocketAlive.and.callFake(() => {
                return false;
            });
            socketServiceSpy.disconnect.and.callFake(() => {});
            service.disconnect();
            expect(socketServiceSpy.isSocketAlive).toHaveBeenCalled();
            expect(socketServiceSpy.disconnect).not.toHaveBeenCalled();
        });
    });
    it('playerExited should send the right elements', () => {
        const sessionId = 123;
        service.playerExited(sessionId);
        expect(socketServiceSpy.send).toHaveBeenCalledWith(SessionEvents.PlayerLeft, sessionId);
    });

    it('listenGameEnded listen to SessionEvents.EndedGame that calls a callback', () => {
        const callbackSpy = jasmine.createSpy('callback');
        service.listenGameEnded(callbackSpy);
        socketHelper.peerSideEmit(SessionEvents.LimitedTimeGameEnded);
        expect(callbackSpy).toHaveBeenCalled();
    });

    it('listenNewGame should listen to SessionEvents.NewGame and call a callback', () => {
        const callbackSpy = jasmine.createSpy('callback');
        service.listenNewGame(callbackSpy);
        socketHelper.peerSideEmit(SessionEvents.NewGame);
        expect(callbackSpy).toHaveBeenCalled();
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
        service.listenOpponentLeaves(callbackSpy);
        socketHelper.peerSideEmit(SessionEvents.OpponentLeftGame);
        expect(callbackSpy).toHaveBeenCalled();
    });
    it('listenProvideName should send the right message receiving a certain message', () => {
        const playerName = 'jean';
        service.listenProvideName(playerName);
        socketHelper.peerSideEmit(SessionEvents.ProvideName);
        expect(socketServiceSpy.send).toHaveBeenCalledWith(SessionEvents.PlayerName, playerName);
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
        service.cheatGetAllDifferences(1);
        socketServiceSpy.sendAndCallBack.calls.mostRecent().args[2]([]);
        expect(socketServiceSpy.sendAndCallBack).toHaveBeenCalled();
        expect(socketServiceSpy.sendAndCallBack).toHaveBeenCalledWith(SessionEvents.CheatGetAllDifferences, 1, jasmine.any(Function));
    });
});
