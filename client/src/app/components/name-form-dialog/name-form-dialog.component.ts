import { Component, Inject, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { INPUT_VALIDATION } from '@app/constants/utils-constants';
import { CommunicationService } from '@app/services/communication.service';

/**
 * @title Injecting data when opening a dialog
 */
@Component({
    selector: 'app-name-form-dialog',
    templateUrl: './name-form-dialog.component.html',
    styleUrls: ['./name-form-dialog.component.scss'],
})
export class NameFormDialogComponent {
    @ViewChild('routerButton') redirectionButton: HTMLButtonElement;
    playerName: string;
    gameId: number;
    sessionId: number;
    nameFormControl = new FormControl('', [
        Validators.required,
        Validators.maxLength(INPUT_VALIDATION.max),
        Validators.minLength(INPUT_VALIDATION.min),
        Validators.pattern('[a-zA-Z0-9]*'),
    ]);
    private readonly routerLink = 'solo-game';

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: number,
        private readonly router: Router,
        private readonly communicationService: CommunicationService,
    ) {
        this.gameId = data;
    }

    navigateToGame(): void {
        this.communicationService.customPost(`session/${this.gameId}`).subscribe((response) => {
            this.sessionId = response as number;
            this.router.navigateByUrl(this.routerLink, { state: { gameID: this.gameId, playerName: this.playerName, sessionID: this.sessionId } });
        });
    }
}
