/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestBed } from '@angular/core/testing';
import { GameActionLoggingService } from '@app/services/game-action-logging/gameActionLogging.service';
import { ChatEvents } from '@common/chat.gateway.events';
import { LoggingCodes } from '@common/loggingCodes';
import { SessionEvents } from '@common/session.gateway.events';
import { REPLAY_BASE_TIME_INCREMENT } from '../constantes.service';

fdescribe('GameActionLoggingService', () => {
    let service: GameActionLoggingService;
    const dummyData = {};
    const dummyActionLog = [
        { time: 20, code: 'SessionStart', data: null },
        { time: 40, code: 'TimerUpdate', data: '00:01:00' },
        { time: 60, code: 'DifferenceFound', data: { guess: { x: 10, y: 20 }, correct: true } },
        { time: 80, code: 'ChatMessage', data: { author: 'Alice', message: 'Hello' } },
    ];
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [GameActionLoggingService],
        });
        service = TestBed.inject(GameActionLoggingService);
        jasmine.clock().uninstall();

        jasmine.clock().install();
    });
    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('should call and set on Date.getTime', () => {
        const spy = spyOn(Date.prototype, 'getTime').and.returnValue(1);
        service.setTimeZero();
        expect(spy).toHaveBeenCalled();
        expect(service.startTime).toEqual(1);
    });
    it('getTimeSinceStart should return the appropriate time difference', () => {
        const spy = spyOn(Date.prototype, 'getTime').and.returnValues(1, 10);

        service.setTimeZero();
        expect(spy).toHaveBeenCalled();
        expect(service.startTime).toEqual(1);
        expect(service.getTimeSinceStart()).toEqual(9);
    });
    describe('logAction', () => {
        it('should properly reset the service if the event is SessionEvents.StartClassicSession ', () => {
            const spy = spyOn(service, 'setTimeZero');
            service.isRecording = false;
            service.actionLog = dummyActionLog;

            service.logAction(SessionEvents.StartClassicSession, {});

            expect(spy).toHaveBeenCalled();
            expect(service.isRecording).toBeTrue();
            expect(service.actionLog.length).toEqual(1);
        });
        it('should properly reset the service if the event is SessionEvents.GetClientId ', () => {
            const spy = spyOn(service, 'setTimeZero');
            service.isRecording = false;
            service.actionLog = dummyActionLog;

            service.logAction(SessionEvents.GetClientId, {});

            expect(spy).toHaveBeenCalled();
            expect(service.isRecording).toBeTrue();
            expect(service.actionLog.length).toEqual(1);
        });
        it('should push a new action to actionLog if isRecording', () => {
            spyOn(service, 'getTimeSinceStart').and.returnValue(1);

            const spy = spyOn(service.actionLog, 'push');
            service.isRecording = true;
            service.logAction('dummylog', {});
            expect(spy).toHaveBeenCalledWith({ time: 1, code: 'dummylog', data: {} });
        });
        it('shouldnot  push a new action to actionLog if isnt Recording', () => {
            spyOn(service, 'getTimeSinceStart').and.returnValue(1);

            const spy = spyOn(service.actionLog, 'push');
            service.isRecording = false;
            service.logAction('dummylog', {});
            expect(spy).not.toHaveBeenCalled();
        });
    });
    describe('replaySingleAction', () => {
        it('should call the corresponding action when reading SessionEvents.TimerUpdate', () => {
            service.timerUpdateFunction = (data: unknown) => {};
            const spy = spyOn(service, 'timerUpdateFunction');
            service.replayAction({ time: 0, code: SessionEvents.TimerUpdate, data: dummyData });
            expect(spy).toHaveBeenCalled();
        });
        it('should call the corresponding action when reading SessionEvents.SubmitCoordinatesSoloGame', () => {
            service.diffFoundFunction = (data: unknown) => {};

            const spy = spyOn(service, 'diffFoundFunction');
            service.replayAction({ time: 0, code: SessionEvents.SubmitCoordinatesSoloGame, data: dummyData });
            expect(spy).toHaveBeenCalled();
        });
        it('should call the corresponding action when reading SessionEvents.DifferenceFound', () => {
            service.diffFoundFunction = (data: unknown) => {};

            const spy = spyOn(service, 'diffFoundFunction');
            service.replayAction({ time: 0, code: SessionEvents.DifferenceFound, data: dummyData });
            expect(spy).toHaveBeenCalled();
        });
        it('should call the corresponding action when reading LoggingCodes.cheatLog', () => {
            service.cheatFunction = (data: unknown) => {};

            const spy = spyOn(service, 'cheatFunction');
            service.replayAction({ time: 0, code: LoggingCodes.cheatLog, data: dummyData });
            expect(spy).toHaveBeenCalled();
        });

        it('should call the corresponding action when reading ChatEvents.SystemMessageFromServer', () => {
            service.systemErrorFunction = (data: unknown) => {};

            const spy = spyOn(service, 'systemErrorFunction');
            service.replayAction({ time: 0, code: ChatEvents.SystemMessageFromServer, data: dummyData });
            expect(spy).toHaveBeenCalled();
        });
        it('should call the corresponding action when reading ChatEvents.MessageFromServer', () => {
            service.messageFunction = (data: unknown) => {};

            const spy = spyOn(service, 'messageFunction');
            service.replayAction({ time: 0, code: ChatEvents.MessageFromServer, data: dummyData });
            expect(spy).toHaveBeenCalled();
        });
        it('should call the corresponding action when reading LoggingCodes.clueLog', () => {
            service.getClueFunction = (data: unknown) => {};

            const spy = spyOn(service, 'getClueFunction');
            service.replayAction({ time: 0, code: LoggingCodes.clueLog, data: dummyData });
            expect(spy).toHaveBeenCalled();
        });
    });
    it('should clear interval and reset intervalPlayAll to 0', () => {
        service.intervalPlayAll = setInterval(() => {}, 1000);
        const spy = spyOn(window, 'clearInterval');

        service.clearReplayAll();

        expect(spy).toHaveBeenCalled();
        expect(service.intervalPlayAll).toBe(0);
    });
    describe('replayAllActions', () => {
        beforeEach(() => {
            service.clearChatFunction = () => {
                return;
            };

            service.isRecording = true;
        });

        it('should set isRecording to false at the beginning', () => {
            service.isRecording = true;
            service.replayAllAction();
            expect(service.isRecording).toBe(false);
        });
        it('should do nothing else is actionLogisEmpty', () => {
            const spy = spyOn(window, 'setInterval');

            service.actionLog = [];

            service.replayAllAction();

            expect(spy).not.toHaveBeenCalled();
        });
        it('if isnt recording, should set Interval', () => {
            spyOn(window, 'setInterval');
            service.isRecording = false;
            service.actionLog = dummyActionLog;
            service.replayAllAction();
            expect(setInterval).toHaveBeenCalledWith(jasmine.any(Function), REPLAY_BASE_TIME_INCREMENT);
            jasmine.clock().tick(REPLAY_BASE_TIME_INCREMENT);
        });
        it('should set isRecording to false and clear the interval when all actions are replayed', () => {
            spyOn(window, 'clearInterval');
            service.actionLog = dummyActionLog;
            service.replayAllAction();
            jasmine.clock().tick(1000);
            expect(window.clearInterval).toHaveBeenCalled();
        });
    });
    describe('replayActionToTime ', () => {
        it('should replayActions with timeStamp between lastTime and nextTime', () => {
            const spy = spyOn(service, 'replayAction');
            service.actionLog = dummyActionLog;
            service.lastTimeReplayed = 30;
            service.replayActionsToTime(50);
            expect(spy).toHaveBeenCalledOnceWith(dummyActionLog[1]);
        });
    });
});
