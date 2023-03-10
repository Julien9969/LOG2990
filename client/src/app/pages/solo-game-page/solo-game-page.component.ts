import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PopupDialogComponent } from '@app/components/popup-dialog/popup-dialog.component';
import { CommunicationService } from '@app/services/communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { Timer } from '@app/services/timer.service';
import { Game } from '@common/game';

@Component({
    selector: 'app-solo-game-page',
    templateUrl: './solo-game-page.component.html',
    styleUrls: ['./solo-game-page.component.scss'],
})
export class SoloGamePageComponent implements OnInit, OnDestroy {
    playerName: string;
    opponentName: string;
    isLoaded: boolean = false;
    isSolo: boolean;
    sessionId: number;
    gameInfos: Game;
    gameID: string;
    nDiffFound: number = 0;
    timer = new Timer();

    constructor(
        private readonly dialog: MatDialog,
        private readonly communicationService: CommunicationService,
        private readonly socketClient: SocketClientService,
    ) {
        this.isSolo = window.history.state.isSolo;
        if (!this.isSolo) {
            this.opponentName = window.history.state.opponentName;
        }
        this.playerName = window.history.state.playerName;
        this.sessionId = window.history.state.sessionId;
        this.gameID = window.history.state.gameID;
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

    ngOnDestroy(): void {
        this.socketClient.send('leaveRoom');
    }
}
