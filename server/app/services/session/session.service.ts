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
        if (secondSocketId) {
            newSession = new Session(id, firstSocketId, secondSocketId);
        } else {
            newSession = new Session(id, firstSocketId);
        }
        const sessionId = this.addToList(newSession);
        return sessionId;
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
     * Retourne toute le sessions présentement actives
     *
     * @returns La liste des sessions en cours
     */
    getAll(): Session[] {
        return this.activeSessions;
    }

    /**
     * Supprime une session en cours
     *
     * @param id L'identifiant de la session à supprimer
     */
    delete(id: number) {
        const game = this.findById(id);
        const index = this.activeSessions.indexOf(game);
        if (!index) {
            throw new Error('Aucune session trouvee avec ce ID.');
        }
        this.activeSessions.splice(index, 1);
    }

    /**
     * Cherche une session en cours
     *
     * @param id L'identifiant de la session
     * @returns La session
     */
    findById(id: number): Session | undefined {
        return this.activeSessions.find((session: Session) => session.id === id);
    }

    /**
     * Génère un nouvel identifiant unique (pour une session)
     *
     * @returns nouvel identifiant unique
     */
    private generateUniqueId(): number {
        let id = Math.floor(Math.random() * SESSION_ID_CAP);
        while (this.findById(id)) {
            id = Math.floor(Math.random() * SESSION_ID_CAP);
        }
        return id;
    }
}
