/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { GuessResult } from '@common/guess-result';
@Injectable({
    providedIn: 'root',
})
export class GameActionLoggingService {
    timerUpdateFunction: (time: string) => void;
    diffFoundFunction: (data: GuessResult) => void;
    cheatFunction: () => void;
    isRecording: boolean = true;
    startTime: number;
    actionLog: [number, string, any][] = [];
    currentIndex: number = 0;

    setTimeZero(): void {
        this.startTime = new Date().getTime();
    }
    getTimeSinceStart(): number {
        return new Date().getTime() - this.startTime;
    }
    logAction(event: string, data: any) {
        if (this.isRecording) {
            this.actionLog.push([this.getTimeSinceStart(), event, data]);
        }
    }

    startReplay() {
        this.isRecording = false;
        this.setTimeZero(); // just for TESTING, should have its logic for speed.
    }

    // TODO: refactor loggedAction and loggedFunciton as schemas for readability
    async replayAction(loggedAction: [number, string, any]) {
        switch (loggedAction[1]) {
            case 'timerUpdate':
                this.timerUpdateFunction(loggedAction[2]);
                break;
            case 'submitCoordinates':
                this.diffFoundFunction(loggedAction[2]);
                break;
            case 'cheatGetAllDifferences':
                this.cheatFunction();
                break;
        }
    }

    async replayAllAction() {
        console.log('replayAllActions');
        console.log(this.actionLog);
        let index = 0;
        const arr = this.actionLog;
        const interval = setInterval(() => {
            this.replayAction(arr[index++]);
            if (index === arr.length) {
                clearInterval(interval);
            }
        }, 250);
    }

    getNextTime() {
        return this.actionLog[this.currentIndex + 1][0];
    }

    replayActionsToTime() {
        const time = this.getTimeSinceStart(); // just for TESTING
        for (; this.getNextTime() <= time; this.currentIndex++) {
            this.replayAction(this.actionLog[this.currentIndex]);
        }
    }
}
