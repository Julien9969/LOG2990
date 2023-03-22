import { Injectable } from '@angular/core';
import { SessionEvents } from '@common/session.gateway.events';
import { MatchMakingEvents } from '@common/match-making.gateway.events';
import { SocketClientService } from '@app/services/socket-client.service';
import { StartSessionData } from '@common/start-session-data';

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
        this.socketService.send(MatchMakingEvents.StartMatchmaking, gameId);
    }

    async someOneWaiting(gameId: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.socketService.sendAndCallBack(MatchMakingEvents.SomeOneWaiting, gameId, (response: boolean) => {
                resolve(response);
            });
        });
    }

    async roomCreatedForThisGame(gameId: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.socketService.sendAndCallBack(MatchMakingEvents.RoomCreatedForThisGame, gameId, (response: boolean) => {
                resolve(response);
            });
        });
    }

    opponentJoined(callback: (opponentName: string) => void) {
        this.socketService.on(MatchMakingEvents.OpponentJoined, (opponentName: string) => {
            callback(opponentName);
        });
    }

    opponentLeft(callback: () => void) {
        this.socketService.on(MatchMakingEvents.OpponentLeft, () => {
            callback();
        });
    }

    joinRoom(gameId: string, playerName: string) {
        this.socketService.send(MatchMakingEvents.JoinRoom, { gameId, playerName });
    }

    iVeBeenAccepted(callback: (opponentName: string) => void) {
        this.socketService.on(MatchMakingEvents.AcceptOtherPlayer, (opponentName: string) => {
            callback(opponentName);
        });
    }

    iVeBeenRejected(callback: (player: string) => void) {
        this.socketService.on(MatchMakingEvents.RejectOtherPlayer, (playerName: string) => {
            callback(playerName);
        });
    }

    roomReachable(callback: () => void) {
        this.socketService.on(MatchMakingEvents.RoomReachable, () => {
            callback();
        });
    }

    sessionIdReceived(callback: (sessionId: number) => void) {
        this.socketService.on(SessionEvents.SessionId, (sessionId: number) => {
            callback(sessionId);
        });
    }

    async acceptOpponent(playerName: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.socketService.sendAndCallBack(MatchMakingEvents.AcceptOpponent, playerName, (response: boolean) => {
                resolve(response);
            });
        });
    }

    rejectOpponent(gameId: string, playerName: string) {
        this.socketService.send(MatchMakingEvents.RejectOpponent, { gameId, playerName });
    }

    leaveWaiting(gameId: string) {
        this.socketService.send(MatchMakingEvents.LeaveWaitingRoom, gameId);
    }

    startMultiSession(gameId: string) {
        const data: StartSessionData = { gameId, isSolo: false };
        this.socketService.send(SessionEvents.StartSession, data);
    }

    startSoloSession(gameId: string, callback: (sessionId: number) => void) {
        const data: StartSessionData = { gameId, isSolo: true };
        this.socketService.sendAndCallBack(SessionEvents.StartSession, data, callback);
    }

    updateRoomView(callback: () => void) {
        this.socketService.on(MatchMakingEvents.UpdateRoomView, async () => {
            callback();
        });
    }

    gameDeleted(callback: () => void) {
        this.socketService.on(SessionEvents.GameDeleted, async () => {
            callback();
        });
    }
}
