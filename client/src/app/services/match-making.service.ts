/* eslint-disable no-console */
import { Injectable } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client.service';

@Injectable({
    providedIn: 'root',
})
export class MatchMakingService {
    constructor(public socketService: SocketClientService) {}

    startMatchmaking(gameId: number) {
        this.socketService.send('startMatchmaking', gameId);
    }

    async someOneWaiting(gameId: number): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.socketService.sendAndCallBack('someOneWaiting', gameId, (response: boolean) => {
                resolve(response);
            });
        });
    }

    opponentJoined(callback: (opponentName: string) => void) {
        this.socketService.on('opponentJoined', (opponentName: string) => {
            callback(opponentName);
        });
    }

    joinRoom(gameId: number, playerName: string) {
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

    rejectOpponent(gameId: number, playerName: string) {
        this.socketService.send('rejectOpponent', { gameId, playerName });
    }

    leaveWaiting(gameId: number) {
        this.socketService.send('leaveWaitingRoom', gameId);
    }

    askForSessionId(gameId: number) {
        this.socketService.send('askForSessionId', gameId);
    }

    connect() {
        if (!this.socketService.isSocketAlive()) {
            this.socketService.connect();
            this.configureBaseFeatures();
        }
    }

    configureBaseFeatures() {
        this.socketService.on('opponentLeftGame', () => {
            alert('Votre adversaire a quitté la partie');
        });
    }
}
