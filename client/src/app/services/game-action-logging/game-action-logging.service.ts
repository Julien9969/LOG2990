/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { REPLAY_BASE_TIME_INCREMENT } from '@app/constants/utils-constants';
import { ChatEvents } from '@common/chat.gateway.events';
import { Coordinate } from '@common/coordinate';
import { Game } from '@common/game';
import { GuessResult } from '@common/guess-result';
import { LoggingCodes } from '@common/loggingCodes';
import { SessionEvents } from '@common/session.gateway.events';
@Injectable({
    providedIn: 'root',
})
export class GameActionLoggingService {
    timerUpdateFunction: (time: string) => void;
    diffFoundFunction: (data: GuessResult) => void;
    cheatFunction: (data: { isStarting: boolean; pixelList: Coordinate[]; diffList: Coordinate[][] }) => void;
    systemErrorFunction: (data: { systemCode: string; playerName: string }) => void;
    getClueFunction: (data: { nClueLeft: number; diffList: Coordinate[] }) => void;
    messageFunction: (data: any) => void;
    clearChatFunction: () => void;
    imageMain: ImageData;
    imageAlt: ImageData;
    gameInfos: Game;
    intervalPlayAll: any;
    isRecording: boolean = true; // moreLike Is not replaying
    startTime: number;
    speedMultiplier = 1;
    lastTimeReplayed: number = 0;
    actionLog: { time: number; code: string; data: any }[] = [];

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
        if (event === SessionEvents.StartClassicSession || event === SessionEvents.GetClientId) {
            this.actionLog = [];
            this.isRecording = true;

            this.setTimeZero();
        }
        if (this.isRecording) {
            this.actionLog.push({ time: this.getTimeSinceStart(), code: event, data });
        }
    }

    async replayAction(loggedAction: { time: number; code: string; data: any }) {
        switch (loggedAction.code) {
            case SessionEvents.TimerUpdate:
                this.timerUpdateFunction(loggedAction.data);
                break;
            case SessionEvents.SubmitCoordinatesSoloGame:
            case SessionEvents.DifferenceFound:
                this.diffFoundFunction(loggedAction.data);
                break;
            case LoggingCodes.cheatLog:
                await this.cheatFunction(loggedAction.data);
                break;
            case ChatEvents.SystemMessageFromServer:
                await this.systemErrorFunction(loggedAction.data);
                break;
            case ChatEvents.MessageFromServer:
                this.messageFunction(loggedAction.data);
                break;
            case LoggingCodes.clueLog:
                this.getClueFunction(loggedAction.data);
                break;
        }
    }

    async replayAllAction() {
        this.isRecording = false;
        let time = 0;
        this.lastTimeReplayed = time;
        this.clearChatFunction();
        if (this.actionLog.length === 0) {
            return;
        }
        this.intervalPlayAll = setInterval(() => {
            time += REPLAY_BASE_TIME_INCREMENT * this.speedMultiplier;
            this.replayActionsToTime(time);
            if (this.lastTimeReplayed > this.actionLog[this.actionLog.length - 1].time) {
                this.isRecording = false;
                clearInterval(this.intervalPlayAll);
            }
        }, REPLAY_BASE_TIME_INCREMENT);
    }
    clearReplayAll() {
        clearInterval(this.intervalPlayAll);
        this.intervalPlayAll = 0;
    }
    replayActionsToTime(time: number) {
        this.actionLog
            .filter((action) => {
                return action.time < time && action.time >= this.lastTimeReplayed;
            })
            .forEach((action) => {
                this.replayAction(action);
            });
        this.lastTimeReplayed = time;
    }
}
