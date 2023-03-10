/* eslint-disable no-console */
import { Injectable } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client.service';

@Injectable({
    providedIn: 'root',
})
export class MatchMakingService {
    constructor(private socketService: SocketClientService) {}

    connect() {
        if (!this.socketService.isSocketAlive()) {
            this.socketService.connect();
        }
    }

    startMatchmaking(gameId: string) {
        this.socketService.send('startMatchmaking', gameId);
    }

    async someOneWaiting(gameId: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.socketService.sendAndCallBack('someOneWaiting', gameId, (response: boolean) => {
                resolve(response);
            });
        });
    }

    async roomCreatedForThisGame(gameId: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.socketService.sendAndCallBack('roomCreatedForThisGame', gameId, (response: boolean) => {
                resolve(response);
            });
        });
    }

    opponentJoined(callback: (opponentName: string) => void) {
        this.socketService.on('opponentJoined', (opponentName: string) => {
            callback(opponentName);
        });
    }

    opponentLeft(callback: () => void) {
        this.socketService.on('opponentLeft', () => {
            callback();
        });
    }

    joinRoom(gameId: string, playerName: string) {
        this.socketService.send('joinRoom', { gameId, playerName });
    }

    iVeBeenAccepted(callback: (opponentName: string) => void) {
        this.socketService.on('acceptOtherPlayer', (opponentName: string) => {
            callback(opponentName);
        });
    }

    iVeBeenRejected(callback: (player: string) => void) {
        this.socketService.on('rejectOtherPlayer', (playerName: string) => {
            callback(playerName);
        });
    }

    roomReachable(callback: () => void) {
        this.socketService.on('roomReachable', () => {
            callback();
        });
    }

    sessionIdReceived(callback: (sessionId: number) => void) {
        this.socketService.on('sessionId', (sessionId: number) => {
            callback(sessionId);
        });
    }

    async acceptOpponent(playerName: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.socketService.sendAndCallBack('acceptOpponent', playerName, (response: boolean) => {
                resolve(response);
            });
        });
    }

    rejectOpponent(gameId: string, playerName: string) {
        this.socketService.send('rejectOpponent', { gameId, playerName });
    }

    leaveWaiting(gameId: string) {
        this.socketService.send('leaveWaitingRoom', gameId);
    }

    askForSessionId(gameId: string) {
        this.socketService.send('askForSessionId', gameId);
    }

    updateRoomView(callback: () => void) {
        this.socketService.on('updateRoomView', async () => {
            callback();
        });
    }
}
