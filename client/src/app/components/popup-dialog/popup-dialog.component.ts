import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AudioService } from '@app/services/audio/audio.service';
import { ImageOperationService } from '@app/services/image-operation/image-operation.service';

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
    message: string;

    deleteMessage: string;
    buttonCallback: () => Promise<void>;

    hasReplay: boolean;

    // eslint-disable-next-line max-params -- les parametres sont necessaires
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: [string, string, { gameId: string; playerName: string; hasReplay: boolean }],
        private imageOperationService: ImageOperationService,
        public dialogRef: MatDialogRef<PopupDialogComponent>,
        private audioService: AudioService,
        private readonly router: Router,
    ) {
        this.templateName = data[0];
    }

    ngOnInit(): void {
        if (this.templateName === 'endGame') {
            this.audioService.playAudio('win');
            this.message = this.data[1];
            this.hasReplay = this.data[2].hasReplay;
        }
    }
    replay() {
        this.imageOperationService.clearAllIntervals();
        this.router.navigate(['/replay'], { state: this.data[2] });
    }
}
