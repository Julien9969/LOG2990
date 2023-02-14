import { Component, HostListener, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PopupDialogComponent } from '@app/components/popup-dialog/popup-dialog.component';
import { CommunicationService } from '@app/services/communication.service';
import { Timer } from '@app/services/timer.service';
import { Game } from '@common/game';

@Component({
    selector: 'app-solo-game-page',
    templateUrl: './solo-game-page.component.html',
    styleUrls: ['./solo-game-page.component.scss'],
})
export class SoloGamePageComponent implements OnInit {
    playerName: string;
    isLoaded: boolean = false;
    isSolo: boolean;
    sessionId: number;
    gameInfos: Game;
    gameID: number;
    nDiffFound: number = 0;
    timer = new Timer();

    constructor(private readonly dialog: MatDialog, private readonly communicationService: CommunicationService) {
        this.playerName = window.history.state.playerName as string;
        this.sessionId = window.history.state.sessionID as number;
        this.gameID = window.history.state.gameID as number;
    }

    get getTimer(): Timer {
        return this.timer;
    }

    @HostListener('window:beforeunload', ['$event'])
    unloadNotification($event: Event) {
        // eslint-disable-next-line deprecation/deprecation
        $event.returnValue = true; // The not deprecated equivalent attribute don't do the right thing
    }

    ngOnInit(): void {
        if (this.playerName === undefined || this.sessionId === undefined || this.gameID === undefined) {
            window.location.replace('/home');
        }

        this.getGameInfos();
        this.timer.startGameTimer(0);
    }

    getGameInfos(): void {
        // Define to true for Sprint 1 (no multiplayer)
        this.isSolo = true;
        this.communicationService.gameInfoGet(this.gameID).subscribe({
            next: (response) => {
                this.gameInfos = response as Game;
                this.isLoaded = true;
            },
        });
    }

    incrementDiff(): void {
        this.nDiffFound++;
        if (this.nDiffFound >= this.gameInfos.differenceCount) {
            this.openDialog('endGame');
        }
    }

    openDialog(dialogTypes: string): void {
        this.dialog.closeAll();

        switch (dialogTypes) {
            case 'clue':
                this.dialog.open(PopupDialogComponent, { closeOnNavigation: true, autoFocus: false, data: 'clue' });
                break;
            case 'quit':
                this.dialog.open(PopupDialogComponent, { closeOnNavigation: true, autoFocus: false, data: 'quit' });
                break;
            case 'endGame':
                this.timer.stopGameTimer();
                this.dialog.open(PopupDialogComponent, { closeOnNavigation: true, disableClose: true, autoFocus: false, data: 'endGame' });
                break;
        }
    }
}
