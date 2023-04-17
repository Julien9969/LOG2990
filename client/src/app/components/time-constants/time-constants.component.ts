import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PopupDialogComponent } from '@app/components/popup-dialog/popup-dialog.component';
import { TimeConstantsPopupComponent } from '@app/components/time-constants-popup/time-constants-popup.component';
import { GameService } from '@app/services/game/game.service';
import { GameConstants } from '@common/game-constants';
@Component({
    selector: 'app-time-constants',
    templateUrl: './time-constants.component.html',
    styleUrls: ['./time-constants.component.scss'],
})
export class TimeConstantsComponent implements OnInit {
    gameConstants: GameConstants = {};

    constructor(private readonly dialog: MatDialog, private readonly gameService: GameService) {}

    async ngOnInit() {
        try {
            this.gameConstants = await this.gameService.getGameConstants();
            if(!this.gameConstants) this.gameConstants = {};
        } catch (err) {
            this.gameConstants = {};
        }
    }

    openEditPopup(): void {
        this.dialog.open(TimeConstantsPopupComponent, { autoFocus: false, data: this.gameConstants });
    }

    resetTimeConstants() {
        this.dialog.closeAll();
        const popup = this.dialog.open(PopupDialogComponent, { closeOnNavigation: true, autoFocus: false, data: ['delete'] }).componentInstance;
        popup.deleteMessage = 'Voulez-vous vraiment réinitialiser les constantes de jeu?';
        popup.buttonCallback = this.gameService.resetTimeConstants;
    }
}
