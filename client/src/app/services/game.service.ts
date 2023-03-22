import { Injectable } from '@angular/core';
import { GROUP_SIZE } from '@app/constants/utils-constants';
import { Game } from '@common/game';
import { CommunicationService } from './communication.service';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    constructor(private readonly communicationService: CommunicationService) {}

    /**
     * Créer une liste de liste(s) avec chacune une longueur maximale de 4 jeux
     *
     * @returns une Promise de la liste de liste(s)
     */
    async getGroupedData(): Promise<Game[][]> {
        try {
            const allGamesList: Game[] = await this.getData();
            const groupedGameList: Game[][] = [[]];
            let index = 0;
            for (const game of allGamesList) {
                if (groupedGameList[index].length === GROUP_SIZE) {
                    index++;
                    groupedGameList.push([]);
                }
                groupedGameList[index].push(game);
            }
            return groupedGameList;
        } catch {
            throw new Error();
        }
    }

    /**
     * Prend le URL de l'image principale du jeu
     *
     * @param game Jeu qui a besoin de son image
     * @returns l'URL de l'image principale
     */
    getMainImageURL(game: Game): string {
        try {
            return this.communicationService.getImageURL(game.imageMain);
        } catch {
            return '';
        }
    }

    /**
     * Utilise CommunicationService pour prendre la liste de tout les jeux sur le serveur
     *
     * @returns a list of games
     */
    async getData(): Promise<Game[]> {
        return await this.communicationService.getRequest('games');
    }

    async deleteGame(id: string): Promise<void> {
        await this.communicationService.deleteRequest(`games/${id}`);
    }
}
