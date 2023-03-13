import { Injectable } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client.service';
import { Coordinate } from '@common/coordinate';
import { GuessResult } from '@common/guess-result';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class InGameService {
    private differenceFound: Subject<GuessResult> = new Subject();
    constructor(public socketService: SocketClientService) {}

    async submitCoordinates(sessionID: number, coordinates: Coordinate): Promise<GuessResult> {
        const data: [number, Coordinate] = [sessionID, coordinates];
        return new Promise<GuessResult>((resolve) => {
            this.socketService.sendAndCallBack('submitCoordinates', data, (response: GuessResult) => {
                resolve(response);
            });
        });
    }

    async retrieveSocketId(): Promise<string> {
        return new Promise<string>((resolve) => {
            this.socketService.sendAndCallBack('getClientId', undefined, (response: string) => {
                resolve(response);
            });
        });
    }

    sendDifferenceFound(sessionID: number, differenceFound: GuessResult) {
        this.socketService.send('differenceFound', differenceFound);
    }

    receiveDifferenceFound = (): Observable<GuessResult> => {
        this.socketService.on('differenceFound', (differenceFound: GuessResult) => {
            this.differenceFound.next(differenceFound);
        });
        return this.differenceFound.asObservable();
    };

    connect() {
        if (!this.socketService.isSocketAlive()) {
            this.socketService.connect();
        }
    }

    playerExited() {
        this.socketService.send('playerLeft');
    }

    listenOpponentLeaves(callback: () => void) {
        this.socketService.on('opponentLeftGame', () => {
            callback();
            this.socketService.disconnect();
        });
    }

    playerWon(callback: (winningPlayerName: string) => void) {
        this.socketService.on('playerWon', (winningPlayerName: string) => {
            callback(winningPlayerName);
        });
    }

    disconnect() {
        if (this.socketService.isSocketAlive()) {
            this.socketService.disconnect();
        }
    }
}
