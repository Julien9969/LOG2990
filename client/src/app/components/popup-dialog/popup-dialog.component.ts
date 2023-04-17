import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AudioService } from '@app/services/audio.service';
import { InGameService } from '@app/services/in-game.service';
/**
 * @title Inject des données lorsqu'on ouvre un dialogue
 */
@Component({
    selector: 'app-popup-dialog',
    templateUrl: './popup-dialog.component.html',
    styleUrls: ['./popup-dialog.component.scss'],
})
export class PopupDialogComponent implements OnInit {
    templateName: string;

    message = '';
    playerWon = false;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: string[],

        public dialogRef: MatDialogRef<PopupDialogComponent>,
        private audioService: AudioService,
        private readonly socket: InGameService,
    ) {
        this.templateName = data[0];
    }

    ngOnInit(): void {
        if (this.templateName === 'endGame') {
            this.audioService.playAudio('win');
            this.message = this.data[1];
        }
    }
    replay() {
        this.socket.socketService.loggingService.replayAllAction();
    }
    getClueNumber(): number {
        const noMagicNumber = 10;
        return noMagicNumber;
    }
}
