/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { Coordinate } from '@common/coordinate';
import { GuessResult } from '@common/guess-result';
@Injectable({
    providedIn: 'root',
})
export class GameActionLoggingService {
    timerUpdateFunction: (time: string) => void;
    diffFoundFunction: (data: GuessResult) => void;
    cheatFunction: (data: { isStarting: boolean; pixelList: Coordinate[]; diffList: Coordinate[][] }) => void;
    systemErrorFunction: (data: { systemCode: string; playerName: string }) => void;
    intervalPlayAll: any;
    isRecording: boolean = true; // moreLike Is not replaying
    startTime: number;
    baseTimeIncrement = 47;
    speedMultiplier = 1;
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
            case 'CHEATLOGGER':
                await this.cheatFunction(loggedAction[2]);
                break;
            case 'systemMessageFromServer':
                await this.systemErrorFunction(loggedAction[2]);
        }
    }

    async replayAllAction() {
        this.isRecording = false;
        let time = 0;
        this.lastTimeReplayed = time;

        console.log(this.actionLog);
        if (this.actionLog.length === 0) {
            return;
        }
        this.intervalPlayAll = setInterval(() => {
            time += this.baseTimeIncrement * this.speedMultiplier;
            this.replayActionsToTime(time);
            if (this.lastTimeReplayed > this.actionLog.slice(-1)[0][0]) {
                this.isRecording = false;
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
