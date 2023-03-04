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
    create(id: string): number {
        const newSession = new Session();
        newSession.gameID = id;
        this.addToList(newSession);
        return newSession.id;
    }

    /**
     * Rajoute une session au service de gestion des sessions de jeu
     *
     * @param session La session à rajouter à la liste des sessions
     */
    addToList(session: Session) {
        while (session.id === undefined || this.findById(session.id) != null) {
            session.id = Math.floor(Math.random() * SESSION_ID_CAP);
        }
        this.activeSessions.push(session);
    }

    /**
     * @returns La liste des sessions en cours
     */
    getAll() {
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
    findById(id: number): Session {
        return this.activeSessions.find((session: Session) => session.id === id);
    }
}
