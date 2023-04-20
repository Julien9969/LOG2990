import { Injectable } from '@angular/core';
import { GROUP_SIZE } from '@app/constants/utils-constants';
import { CommunicationService } from '@app/services/communication/communication.service';
import { Game } from '@common/game';
import { GameConstants } from '@common/game-constants';
import { DEFAULT_GAME_TIME, DEFAULT_PENALTY_TIME, DEFAULT_REWARD_TIME } from '@common/game-constants-values';

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

    async resetLeaderboard(id: string): Promise<void> {
        await this.communicationService.deleteRequest(`games/leaderboards/${id}`);
    }

    async updateGameConstants(gameConsts: GameConstants) {
        await this.communicationService.patchGameConstants(gameConsts);
    }

    async getGameConstants(): Promise<GameConstants> {
        return await this.communicationService.getGameConstants();
    }

    deleteAllGames = async () => {
        await this.communicationService.deleteRequest('games');
        this.reloadWindow();
    };

    resetAllLeaderboards = async () => {
        await this.communicationService.deleteRequest('games/leaderboards');
        this.reloadWindow();
    };

    resetTimeConstants = async () => {
        const defaultGameConsts: GameConstants = {
            time: DEFAULT_GAME_TIME,
            reward: DEFAULT_REWARD_TIME,
            penalty: DEFAULT_PENALTY_TIME,
        };
        await this.communicationService.patchGameConstants(defaultGameConsts);
        this.reloadWindow();
    };

    /**
     * Cette fonction est un wrapper autour de window.location.reload(), pour pouvoir la mock.
     * Elle est nécessaire pour mettre à jour après un changement de configuration de jeux,
     * n'est mais pas couverte par les tests puisqu'elle reload le chrome de tests.
     */
    reloadWindow() {
        window.location.reload();
    }
}
