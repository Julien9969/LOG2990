import { ClueService } from '@app/services/clue/clue.service';
import { MULTIPLAYER_SESSION, SESSION_ID_CAP } from '@app/services/constants/services.const';
import { GameService } from '@app/services/game/game.service';
import { Session } from '@app/services/session/session';
import { Clue } from '@common/clue';
import { Player } from '@common/player';
import { Injectable } from '@nestjs/common';
import { ClassicSession } from './classic-session';
import { LimitedTimeSession } from './time-limited-session';

@Injectable()
export class SessionService {
    activeSessions: Session[] = [];
    socketIdToName = {};

    constructor(private readonly gameService: GameService, private readonly clueService: ClueService) {}

    getName(socketId: string): string {
        return this.socketIdToName[socketId];
    }

    addName(socketId: string, playerName: string) {
        this.socketIdToName[socketId] = playerName;
    }

    removeName(socketId: string) {
        delete this.socketIdToName[socketId];
    }
    /**
     * Crée une session d'un certain jeu
     *
     * @param id L'identifiant du jeu voulu
     * @returns L'identifiant de la session créée
     */
    createNewLimitedTimeSession(socketIdOne: string, socketIdTwo: string = undefined): number {
        const players: Player[] = [{ name: 'unknown', socketId: socketIdOne, differencesFound: [] }];
        if (socketIdTwo) players.push({ name: 'unknown', socketId: socketIdTwo, differencesFound: [] });
        return this.addToList(new LimitedTimeSession(this.gameService, players));
    }

    /**
     * Crée une session d'un certain jeu
     *
     * @param id L'identifiant du jeu voulu
     * @returns L'identifiant de la session créée
     */
    createNewClassicSession(id: string, socketIdOne: string, socketIdTwo: string = undefined): number {
        const players: Player[] = [{ name: 'unknown', socketId: socketIdOne, differencesFound: [] }];
        if (socketIdTwo) players.push({ name: 'unknown', socketId: socketIdTwo, differencesFound: [] });
        return this.addToList(new ClassicSession(this.gameService, id, players));
    }

    /**
     * Rajoute une session au service de gestion des sessions de jeu
     *
     * @param session La session à rajouter à la liste des sessions
     */
    addToList(session: Session): number {
        session.id = this.generateUniqueId();
        this.activeSessions.push(session);
        return session.id;
    }

    /**
     * Supprime une session en cours
     *
     * @param id L'identifiant de la session à supprimer
     */
    delete(id: number, socketId: string) {
        const game = this.findBySessionId(id);
        const index = this.activeSessions.indexOf(game);
        if (this.activeSessions.length < index || index < 0) {
            throw new Error(`Aucune session trouvee avec ce ID ${id}.`);
        }

        if (game.isTimeLimited) {
            const limitedTimeGame: LimitedTimeSession = game as LimitedTimeSession;
            if ((limitedTimeGame.players.length = MULTIPLAYER_SESSION)) {
                limitedTimeGame.deletePlayer(socketId);
                return;
            }
        }
        this.deleteFromActiveSessions(index);
    }

    deleteFromActiveSessions(indexOfSession: number) {
        this.activeSessions[indexOfSession].stopTimer();
        this.activeSessions.splice(indexOfSession, 1);
    }

    /**
     * Cherche une session en cours
     *
     * @param clientId L'identifiant du client
     */
    findByClientId(clientId: string): Session {
        for (const session of this.activeSessions) {
            if (session.players.find((player: Player) => player?.socketId === clientId)) return session;
        }
    }
    /**
     * Cherche une session en cours
     *
     * @param id L'identifiant de la session
     * @returns La session
     */
    findBySessionId(id: number): Session | undefined {
        return this.activeSessions.find((session: Session) => session.id === id);
    }

    generateClue(clientId: string): Clue {
        const session = this.findByClientId(clientId);
        return this.clueService.generateClue(session);
    }

    /**
     * Génère un nouvel identifiant unique (pour une session)
     *
     * @returns nouvel identifiant unique
     */
    private generateUniqueId(): number {
        let id = Math.floor(Math.random() * SESSION_ID_CAP);
        while (this.findBySessionId(id)) {
            id = Math.floor(Math.random() * SESSION_ID_CAP);
        }
        return id;
    }
}
