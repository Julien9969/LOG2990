import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { GameActionLoggingService } from './gameActionLogging.service';
@Injectable({
    providedIn: 'root',
})
export class SocketClientService {
    private socket: Socket;
    constructor(public loggingService: GameActionLoggingService) {}
    isSocketAlive() {
        return this.socket && this.socket.connected;
    }

    connect() {
        this.socket = io(environment.socketUrl, { transports: ['websocket'], upgrade: false });
    }

    disconnect() {
        this.socket.disconnect();
    }

    on<T>(event: string, action: (data: T) => void): void {
        const newActionAndLog = (data: T) => {
            action(data);
            this.loggingService.logAction(event, data);
        };
        this.socket.on(event, newActionAndLog);
    }

    sendAndCallBack<T, U>(event: string, data: T, action: (data: U) => void): void {
        const newActionAndLog = (newData: U) => {
            action(newData);
            this.loggingService.logAction(event, newData);
        };
        this.socket.emit(event, data, newActionAndLog);
    }

    send<T>(event: string, data?: T): void {
        if (data) {
            this.socket.emit(event, data);
        } else {
            this.socket.emit(event);
        }
    }
}
