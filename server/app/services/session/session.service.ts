import { SESSION_ID_CAP } from '@app/services/constants/services.const';
import { Session } from '@app/services/session/session';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionService {
    activeSessions: Session[] = [];

    /**
     * Crée une session d'un certain jeu
     *
     * @param id L'identifiant du jeu voulu
     * @returns L'identifiant de la session créée
     */
    createNewSession(id: string, firstSocketId: string, secondSocketId: string = undefined): number {
        let newSession: Session;
        if (secondSocketId) newSession = new Session(id, firstSocketId, secondSocketId);
        else newSession = new Session(id, firstSocketId);
        return this.addToList(newSession);
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
    delete(id: number) {
        const game = this.findBySessionId(id);
        const index = this.activeSessions.indexOf(game);
        if (this.activeSessions.length < index || index < 0) throw new Error(`Aucune session trouvee avec ce ID ${id}.`);

        this.activeSessions[index].stopTimer();
        this.activeSessions.splice(index, 1);
    }

    /**
     * Supprime toutes les sessions d'un client
     *
     * @param clientId L'identifiant du client
     */
    findByCliendId(clientId: string): Session {
        for (const session of this.activeSessions) {
            if (session.differencesFoundByPlayer.find((differences) => differences[0] === clientId)) return session;
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
