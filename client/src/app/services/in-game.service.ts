import { Injectable } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client.service';
import { Coordinate } from '@common/coordinate';
import { Game } from '@common/game';
import { GuessResult } from '@common/guess-result';
import { SessionEvents } from '@common/session.gateway.events';
import { WinnerInfo } from '@common/winner-info';

@Injectable({
    providedIn: 'root',
})
export class InGameService {
    constructor(public socketService: SocketClientService) {}

    /**
     * validates the coordinates from the guess of the player for a solo game
     *
     * @param sessionID the id of the session where the player is playing
     * @param coordinates the coordinates of the guess
     */
    async submitCoordinatesSolo(sessionID: number, coordinates: Coordinate): Promise<GuessResult> {
        const data: [number, Coordinate] = [sessionID, coordinates];
        return new Promise<GuessResult>((resolve) => {
            this.socketService.sendAndCallBack(SessionEvents.SubmitCoordinatesSoloGame, data, (response: GuessResult) => {
                resolve(response);
            });
        });
    }

    /**
     * validates the coordinates from the guess of the player for a multi game
     *
     * @param sessionID the id of the session where the player is playing
     * @param coordinates the coordinates of the guess
     */
    async submitCoordinatesMulti(sessionID: number, coordinates: Coordinate): Promise<void> {
        const data: [number, Coordinate] = [sessionID, coordinates];
        this.socketService.send(SessionEvents.SubmitCoordinatesMultiGame, data);
    }

    /**
     * validates the coordinates from the guess of the player for a limited time games
     *
     * @param sessionID the id of the session where the player is playing
     * @param coordinates the coordinates of the guess
     */
    async submitCoordinatesLimitedTime(sessionID: number, coordinates: Coordinate): Promise<void> {
        const data: [number, Coordinate] = [sessionID, coordinates];
        this.socketService.send(SessionEvents.SubmitCoordinatesLimitedTime, data);
    }

    /**
     * retrieves the socket id of the client from the server
     *
     * @return the socket id of the client
     */
    async retrieveSocketId(): Promise<string> {
        return new Promise<string>((resolve) => {
            this.socketService.sendAndCallBack(SessionEvents.GetClientId, undefined, (response: string) => {
                resolve(response);
            });
        });
    }

    async cheatGetAllDifferences(sessionId: number): Promise<Coordinate[][]> {
        return new Promise<Coordinate[][]>((resolve) => {
            this.socketService.sendAndCallBack(SessionEvents.CheatGetAllDifferences, sessionId, (response: Coordinate[][]) => {
                resolve(response);
            });
        });
    }

    async requestNewGame(): Promise<Game> {
        const data = 'a enlever';
        return new Promise<Game>((resolve) => {
            this.socketService.sendAndCallBack(SessionEvents.NewGame, data, (response: Game) => {
                resolve(response);
                console.log(`this is the new Games main image id: ${response.imageMain}`);
            });
        });
    }

    /**
     * destroys the websocket connection with the server if it exists
     */
    disconnect() {
        if (this.socketService.isSocketAlive()) {
            this.socketService.disconnect();
        }
    }

    /**
     * alerts the server that the player has left the game
     *
     * @param sessionId the id of the session where the player is playing
     */
    playerExited(sessionId: number) {
        this.socketService.send(SessionEvents.PlayerLeft, sessionId);
    }

    /**
     * listen to the server for any difference found (by the opponent or the player)
     *
     * @param callback the callback function that handles the difference found
     */
    listenDifferenceFound(callback: (differenceFound: GuessResult) => void) {
        this.socketService.on(SessionEvents.DifferenceFound, (differenceFound: GuessResult) => {
            callback(differenceFound);
        });
    }

    /**
     * listen to the server for when the opponent has left the game
     *
     * @param callback the callback function that handles the opponent leaving session
     */
    listenOpponentLeaves(callback: () => void) {
        this.socketService.on(SessionEvents.OpponentLeftGame, () => {
            callback();
            this.socketService.disconnect();
        });
    }

    /**
     * listen to the server to provide the name of the player to the server when asked
     *
     * @param clientName the name of the player
     */
    listenProvideName(clientName: string) {
        this.socketService.on(SessionEvents.ProvideName, () => {
            this.socketService.send(SessionEvents.PlayerName, clientName);
        });
    }

    /**
     * listen to the server for when the session timer has been updated
     *
     * @param callback the callback function that handles the timer update
     */
    listenTimerUpdate(callback: (time: string) => void) {
        this.socketService.on(SessionEvents.TimerUpdate, (time: string) => {
            callback(time);
        });
    }

    /**
     * listen to the server for when a player wins
     *
     * @param callback the callback function that handles a player winning
     */
    listenPlayerWon(callback: (winnerInfo: WinnerInfo) => void) {
        this.socketService.on(SessionEvents.PlayerWon, (winnerInfo: WinnerInfo) => {
            callback(winnerInfo);
        });
    }

    /**
     * listen to the server for when a game in limited time ends
     *
     * @param callback the callback function that handles a game ending
     */
    listenGameEnded(callback: (timerFinished: boolean) => void) {
        this.socketService.on(SessionEvents.EndedGame, (timerFinished: boolean) => {
            callback(timerFinished);
        });
    }

    /**
     * listen to the server for a new game in limited time games
     *
     * @param callback the callback function that handles a new game
     */
    listenNewGame(callback: (newGame: Game) => void) {
        this.socketService.on(SessionEvents.NewGame, (newGame: Game) => {
            callback(newGame);
        });
    }
}
