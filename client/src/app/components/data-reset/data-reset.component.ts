import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GameService } from '@app/services/game/game.service';
import { PopupDialogComponent } from '../popup-dialog/popup-dialog.component';

@Component({
    selector: 'app-data-reset',
    templateUrl: './data-reset.component.html',
    styleUrls: ['./data-reset.component.scss'],
})
export class DataResetComponent {
    constructor(private readonly dialog: MatDialog, private readonly gameService: GameService) {}
    
    deleteAllGames() {
        this.dialog.closeAll();
        const popup = this.dialog.open(PopupDialogComponent, { closeOnNavigation: true, autoFocus: false, data: ['delete'] }).componentInstance;
        popup.deleteMessage = "Voulez-vous vraiment supprimer TOUTES les cartes de jeu?"
        popup.buttonCallback = this.gameService.deleteAllGames;
    }

    resetAllLeaderboards() {
        this.dialog.closeAll();
        const popup = this.dialog.open(PopupDialogComponent, { closeOnNavigation: true, autoFocus: false, data: ['delete'] }).componentInstance;
        popup.deleteMessage = "Voulez-vous vraiment réinitialiser TOUS les meilleurs temps?"
        popup.buttonCallback = this.gameService.resetAllLeaderboards;
    }
}
