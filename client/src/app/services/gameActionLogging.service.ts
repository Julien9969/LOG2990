import { Injectable } from '@angular/core';
import { Socket } from 'socket.io-client';
@Injectable({
    providedIn: 'root',
})
export class GameActionLoggingService {
    isRecording: boolean = true;
    startTime: number;
    actionLog: [number, string, unknown][] = [];
    currentIndex: number = 0;
    private socket: Socket;
    stropRecording() {
        this.isRecording = false;
    }
    setTimeZero(): void {
        this.startTime = new Date().getTime();
    }
    getTimeSinceStart(): number {
        return new Date().getTime() - this.startTime;
    }
    logAction(event: string, data: unknown) {
        if (!this.startTime) {
            this.setTimeZero();
        }
        if (this.isRecording) {
            this.actionLog.push([this.getTimeSinceStart(), event, data]);
            // eslint-disable-next-line no-console
            console.log(this.actionLog);
        }
    }

    startReplay() {
        this.isRecording = false;
        this.setTimeZero(); // just for TESTING, should have its logic for speed.
    }
    replayAction(action: [number, string, unknown]) {
        this.socket.emit(action[1], action[2]);
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
