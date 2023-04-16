import { Injectable } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { Clue } from '@common/clue';
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
     * Demande au serveur pour un indice
     *
     * @param sessionId
     * @returns l'indice
     */
    async retrieveClue() {
        return new Promise<Clue>((resolve) => {
            this.socketService.sendAndCallBack(SessionEvents.AskForClue, undefined, (response: Clue) => {
                resolve(response);
            });
        });
    }

    /**
     * Récupère du serveur l'identifiant de socket du client
     *
     * @return l'identifiant de socket du client
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

    /**
     * Détruit la connection websocket avec le serveur
     */
    disconnect() {
        if (this.socketService.isSocketAlive()) {
            this.socketService.disconnect();
        }
    }

    /**
     * Alerte le serveur qu'un joueur a quitté la partie
     *
     * @param sessionId l'identifiant de la session dans laquelle le joueur se trouvait
     */
    playerExited(sessionId: number) {
        this.socketService.send(SessionEvents.PlayerLeft, sessionId);
    }

    /**
     * Écoute le serveur pour savoir lorsque l'adversaire trouve une différence
     *
     * @param callback la fonction de retour qui s'occupe des différences trouvées
     */
    listenDifferenceFound(callback: (differenceFound: GuessResult) => void) {
        this.socketService.on(SessionEvents.DifferenceFound, (differenceFound: GuessResult) => {
            callback(differenceFound);
        });
    }

    /**
     * Écoute le serveur pour savoir lorsque l'adversaire quitte la partie
     *
     * @param callback la fonction de retour qui s'occupe de lorsque l'adversaire quitte
     */
    listenOpponentLeaves(callback: () => void) {
        this.socketService.on(SessionEvents.OpponentLeftGame, () => {
            callback();
            this.socketService.disconnect();
        });
    }

    /**
     * Écoute le serveur pour produire le nom du joueur lorsque demandé
     *
     * @param clientName Le nom du joueur
     */
    listenProvideName(clientName: string) {
        this.socketService.on(SessionEvents.ProvideName, () => {
            this.socketService.send(SessionEvents.PlayerName, clientName);
        });
    }

    /**
     * Écoute le serveur pour savoir lorsque la minuterie est mise à jours
     *
     * @param callback la fonction de retour qui s'occupe de la mise à jours de la minuterie
     */
    listenTimerUpdate(callback: (time: string) => void) {
        this.socketService.on(SessionEvents.TimerUpdate, (time: string) => {
            callback(time);
        });
    }

    /**
     * Écoute le serveur pour savoir lorsqu'un joueur gagne la partie
     *
     * @param callback la fonction de retour qui s'occupe de lorsqu'un joueur gagne la partie
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
    listenNewGame(callback: (data: [Game, number]) => void) {
        this.socketService.on(SessionEvents.NewGame, (data: [Game, number]) => {
            callback(data);
        });
    }
}
