import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AudioService } from '@app/services/audio/audio.service';

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
    ) {
        this.templateName = data[0];
    }

    ngOnInit(): void {
        if (this.templateName === 'endGame') {
            this.audioService.playAudio('win');
            this.message = this.data[1];
        }
    }

    getClueNumber(): number {
        const noMagicNumber = 10;
        return noMagicNumber;
    }
}
