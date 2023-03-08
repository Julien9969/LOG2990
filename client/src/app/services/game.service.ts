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
     * Creates a list of list each with a maximum size of 4 games
     *
     * @returns a Promise of a list of list each with a maximum size of 4 games
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
     * Get the URL of the game's main URL
     *
     * @param game game that needs his image
     * @returns an URL
     */
    getMainImageURL(game: Game): string {
        try {
            return this.communicationService.getImageURL(game.imageMain);
        } catch {
            return '';
        }
    }

    /**
     * Uses communication Service to get the list of all the games on the server
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
