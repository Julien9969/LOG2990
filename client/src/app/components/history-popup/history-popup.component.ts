import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HistoryService } from '@app/services/history.service';
import { GameHistory } from '@common/game-history';

@Component({
    selector: 'app-popup-dialog',
    templateUrl: './history-popup.component.html',
    styleUrls: ['./history-popup.component.scss'],
})
export class HistoryPopupComponent implements OnInit {
    gameId: string;
    gamesHistory: GameHistory[];

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: string,
        public dialogRef: MatDialogRef<HistoryPopupComponent>,
        private readonly historyService: HistoryService,
    ) {
        this.gameId = data;
    }

    async ngOnInit(): Promise<void> {
        this.gamesHistory = await this.historyService.getHistory(this.gameId);
    }
}
