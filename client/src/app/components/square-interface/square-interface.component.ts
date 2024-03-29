import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDuringLoadingComponent } from '@app/components/error-during-loading/error-during-loading.component';
import { NameFormDialogComponent } from '@app/components/name-form-dialog/name-form-dialog.component';
import { GameService } from '@app/services/game.service';
import { Game } from '@common/game';

@Component({
    selector: 'app-square-interface',
    templateUrl: './square-interface.component.html',
    styleUrls: ['./square-interface.component.scss'],
    providers: [GameService],
})
export class SquareInterfaceComponent {
    @Input() configPage: boolean;
    groupedGames: Game[][] = [[]];
    constructor(private gameService: GameService, private readonly dialog: MatDialog) {
        this.getGroups();
    }
    /**
     * initializes the list of 4 games by games, that will used to create the pages
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
     * Gets the right URL to get one specific game's image
     *
     * @param game the specific game that needs it's image
     * @returns the image's URL or '' if there was an error
     */
    getImage(game: Game): string {
        try {
            return this.gameService.getMainImageURL(game);
        } catch (e: unknown) {
            return '';
        }
    }

    /**
     * Prints the form that permits the user to create a solo game
     *
     * @param game game that the player wants to play
     */
    openFormDialog(game: Game): void {
        this.dialog.closeAll();
        this.dialog.open(NameFormDialogComponent, { closeOnNavigation: true, autoFocus: false, data: game.id });
    }

    // Utilise pour le Sprint 2
    // deleteGame(game: Game): void {
    //     this.gameService.deleteGame(game);
    // }
    // resetTimes(game: Game): void {
    //     this.gameService.resetTimes(game);
    // }
}
