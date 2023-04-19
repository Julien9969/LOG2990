import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDuringLoadingComponent } from '@app/components/error-during-loading/error-during-loading.component';
import { MatchMakingDialogComponent } from '@app/components/match-making-dialog/match-making-dialog.component';
import { DELAY_BEFORE_BUTTONS_UPDATE, GAMES_PER_PAGE } from '@app/constants/utils-constants';
import { GameService } from '@app/services/game/game.service';
import { MatchMakingService } from '@app/services/match-making/match-making.service';
import { Game } from '@common/game';

@Component({
    selector: 'app-square-interface',
    templateUrl: './square-interface.component.html',
    styleUrls: ['./square-interface.component.scss'],
    providers: [GameService],
})
export class SquareInterfaceComponent implements OnInit, AfterViewInit {
    @Input() configPage: boolean;
    groupedGames: Game[][] = [[]];
    someoneWaiting: boolean[] = [];
    constructor(private gameService: GameService, private readonly dialog: MatDialog, public matchMaking: MatchMakingService) {
        this.getGroups();
    }

    ngOnInit(): void {
        this.matchMaking.connect();
        this.baseMatchMakingFeatures();
    }

    async ngAfterViewInit(): Promise<void> {
        setTimeout(async () => {
            await this.reachableGames();
        }, DELAY_BEFORE_BUTTONS_UPDATE);
    }

    /**
     * initialise la liste de 4 jeux par jeux, qui seront utilisé pour créer la page
     */
    async getGroups(): Promise<void> {
        try {
            this.groupedGames = await this.gameService.getGroupedData();
            if (!this.groupedGames) throw new Error();
        } catch (e: unknown) {
            this.dialog.closeAll();
            this.dialog.open(ErrorDuringLoadingComponent);
        }
    }
    /**
     * Prend le bon URL pour chercher une image associé à un jeu
     *
     * @param game le jeu qui a besoin d'une image
     * @returns le URL de l'image ou '' s'il y a une erreur
     */
    getImage(game: Game): string {
        try {
            return this.gameService.getMainImageURL(game);
        } catch (e: unknown) {
            return '';
        }
    }

    /**
     * Imprime le formulaire qui permet à l'utilisateur de créer un jeu solo
     *
     * @param game le jeu que le joueur veut jouer
     */
    openFormDialog(game: Game, isSolo: boolean): void {
        this.dialog.closeAll();
        const gameInfo = { id: game.id, isSolo };
        this.dialog.open(MatchMakingDialogComponent, { closeOnNavigation: true, disableClose: true, autoFocus: false, data: gameInfo });
    }

    async reachableGames(): Promise<void> {
        this.groupedGames.forEach((group, j) => {
            group.forEach((game, i) => {
                this.matchMaking.roomCreatedForThisGame(game.id).then((isRoomOpen) => {
                    this.someoneWaiting[j * GAMES_PER_PAGE + i] = isRoomOpen;
                });
            });
        });
    }

    /**
     * Demande la supression d'un jeu en persistance
     *
     * @param gameId
     */
    async deleteGame(gameId: string): Promise<void> {
        await this.gameService.deleteGame(gameId);
        this.gameService.reloadWindow();
    }

    async resetLeaderboard(gameId: string): Promise<void> {
        await this.gameService.resetLeaderboard(gameId);
        this.gameService.reloadWindow();
    }

    baseMatchMakingFeatures(): void {
        this.matchMaking.updateRoomView(async () => {
            await this.reachableGames();
        });
    }
}
