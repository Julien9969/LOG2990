import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { HistoryService } from '@app/services/history/history.service';
import { GameHistory } from '@common/game-history';

@Component({
    selector: 'app-popup-dialog',
    templateUrl: './history-popup.component.html',
    styleUrls: ['./history-popup.component.scss'],
})
export class HistoryPopupComponent implements OnInit {
    gamesHistory: GameHistory[];

    constructor(public dialogRef: MatDialogRef<HistoryPopupComponent>, public historyService: HistoryService) {}

    async ngOnInit(): Promise<void> {
        this.gamesHistory = await this.historyService.getHistory();
    }
}
