import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HistoryPopupComponent } from '@app/components/history-popup/history-popup.component';

@Component({
    selector: 'app-configuration-game-page',
    templateUrl: 'configuration-game-page.component.html',
    styleUrls: ['./configuration-game-page.component.scss'],
})
export class ConfigurationGameComponent {
    constructor(private dialog: MatDialog) {}

    openHistoryDialog(): void {
        this.dialog.closeAll();
        this.dialog.open(HistoryPopupComponent, { closeOnNavigation: true, disableClose: true, autoFocus: false });
    }
}
