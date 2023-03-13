/* eslint-disable @typescript-eslint/no-magic-numbers */ /* need to define some times */
import { fakeAsync, TestBed } from '@angular/core/testing';
import { TIME_CONST } from '@app/constants/utils-constants';
import { Timer } from './timer.service';

describe('Timer', () => {
    let service: Timer;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [],
            imports: [],
        });
        service = new Timer();
    });

    beforeEach(() => {
        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should timeFormat return the formatted current time', () => {
        service.counter = 60;
        expect(service.formatTime).toEqual('1:00');
    });

    it('should startGameTimer start timer and increase the counter', fakeAsync(() => {
        service.startGameTimer(0);

        for (let time = 0; time < 10; time++) {
            expect(service.counter).toBe(time);
            jasmine.clock().tick(TIME_CONST.oneSecond);
        }
        clearInterval(service.intervalId);
    }));

    it('should format time when timeFormat() is called', () => {
        expect(service['timeFormat'](60)).toEqual('1:00');
        expect(service['timeFormat'](90)).toEqual('1:30');
    });

    it('should clearTimer stop the counting', () => {
        service.startGameTimer(1000);
        jasmine.clock().tick(TIME_CONST.oneSecond);
        expect(service.counter).toBe(1001);
        service.stopGameTimer();
        jasmine.clock().tick(TIME_CONST.oneSecond);
        expect(service.counter).toBe(1001);
    });

    it('should errorTimer set errorGuess to true and reset it after 1 sec', fakeAsync(() => {
        expect(service.errorGuess).toBeFalse();
        service.errorTimer();
        expect(service.errorGuess).toBeTrue();
        jasmine.clock().tick(TIME_CONST.oneSecond);
        expect(service.errorGuess).toBeFalse();
    }));
});
