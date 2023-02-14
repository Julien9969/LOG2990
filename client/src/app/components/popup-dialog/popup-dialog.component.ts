import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * @title Injecting data when opening a dialog
 */
@Component({
    selector: 'app-popup-dialog',
    templateUrl: './popup-dialog.component.html',
    styleUrls: ['./popup-dialog.component.scss'],
})
export class PopupDialogComponent implements OnInit {
    witchTemplate: string;
    audioPlayer = new Audio();
    constructor(@Inject(MAT_DIALOG_DATA) public data: string) {
        this.witchTemplate = data;
    }

    ngOnInit(): void {
        if (this.witchTemplate === 'endGame') {
            this.playWinSound();
        }
    }

    // may be for sprint 2
    getClueNumber(): number {
        const noMagicNumber = 10;
        return noMagicNumber;
    }

    playWinSound() {
        this.audioPlayer.src = 'assets/sounds/win Sound.mp3';
        this.audioPlayer.load();
        this.audioPlayer.play();
    }
}
