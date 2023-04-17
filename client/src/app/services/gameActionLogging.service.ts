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
    intervalPlayAll: any;
    isRecording: boolean = true;
    startTime: number;
    baseTimeIncrement = 250;
    speedMultiplier = 2;
    lastTimeReplayed: number = 0;
    actionLog: [number, string, any][] = [];
    constructor() {
        this.setTimeZero();
    }
    setTimeZero(): void {
        this.startTime = new Date().getTime();
    }
    getTimeSinceStart(): number {
        return new Date().getTime() - this.startTime;
    }
    logAction(event: string, data: any) {
        if (event === 'startSession') {
            this.actionLog = [];
            this.setTimeZero();
        }
        if (this.isRecording) {
            this.actionLog.push([this.getTimeSinceStart(), event, data]);
        }
    }

    // TODO: refactor loggedAction as enum for readability
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
        let time = 0;
        this.lastTimeReplayed = time;

        console.log(this.actionLog);
        this.intervalPlayAll = setInterval(() => {
            time += this.baseTimeIncrement * this.speedMultiplier;
            this.replayActionsToTime(time);
            if (this.lastTimeReplayed > this.actionLog.slice(-1)[0][0]) {
                clearInterval(this.intervalPlayAll);
            }
        }, this.baseTimeIncrement);
    }
    clearReplayAll() {
        clearInterval(this.intervalPlayAll);
    }
    replayActionsToTime(time: number) {
        this.actionLog
            .filter((action) => {
                return action[0] < time && action[0] >= this.lastTimeReplayed;
            })
            .forEach((action) => {
                this.replayAction(action);
            });
        this.lastTimeReplayed = time;
    }
}
