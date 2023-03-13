import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PopupDialogComponent } from '@app/components/popup-dialog/popup-dialog.component';
import { CommunicationService } from '@app/services/communication.service';
import { InGameService } from '@app/services/in-game.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { Timer } from '@app/services/timer.service';
import { Game } from '@common/game';

@Component({
    selector: 'app-solo-game-page',
    templateUrl: './solo-game-page.component.html',
    styleUrls: ['./solo-game-page.component.scss'],
})
export class SoloGamePageComponent implements OnInit, OnDestroy {
    userSocketId: string;

    playerName: string;
    opponentName: string;

    isLoaded: boolean = false;
    isSolo: boolean;

    sessionId: number;
    gameID: string;
    gameInfos: Game;

    nDiffFoundMainPlayer: number = 0;
    nDiffFoundOpponent: number = 0;

    timer = new Timer();

    constructor(
        private readonly dialog: MatDialog,
        private readonly communicationService: CommunicationService,
        private readonly socket: InGameService,
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

    async ngOnInit(): Promise<void> {
        if (this.playerName === undefined || this.sessionId === undefined || this.gameID === undefined) {
            window.location.replace('/home');
        }
        this.getGameInfos();
        this.socket.retrieveSocketId().then((userSocketId) => {
            this.userSocketId = userSocketId;
        });
        this.timer.startGameTimer(0);
        this.socket.listenOpponentLeaves(() => {
            this.openDialog('opponentLeftGame');
        });
        this.socket.playerWon((winnerName: string) => {
            this.endGameDialog(winnerName);
        });
    }

    getGameInfos(): void {
        this.communicationService.gameInfoGet(this.gameID).subscribe({
            next: (response) => {
                this.gameInfos = response as Game;
                this.isLoaded = true;
            },
        });
    }

    handleDiffFoundUpdate(diffFoundByPlayer: [string, number][]) {
        if (this.isSolo && diffFoundByPlayer.length === 1) this.nDiffFoundMainPlayer = diffFoundByPlayer[0][1];
        else if (!this.isSolo && diffFoundByPlayer.length === 2) {
            for (const diffFoundTuple of diffFoundByPlayer) {
                if (this.userSocketId === diffFoundTuple[0]) this.nDiffFoundMainPlayer = diffFoundTuple[1];
                else this.nDiffFoundOpponent = diffFoundTuple[1];
            }
        }
    }

    playerExited() {
        this.socket.playerExited();
    }

    endGameDialog(winnerSocketId: string) {
        let message = '';
        if (winnerSocketId === this.userSocketId) message = 'Bravo! Vous avez gagné vous êtes très fort et beau';
        else message = 'Vous êtes décevant et vous avez perdu!';
        this.dialog.closeAll();
        this.dialog.open(PopupDialogComponent, {
            closeOnNavigation: true,
            disableClose: true,
            autoFocus: false,
            data: ['endGame', message],
        });
    }

    openDialog(dialogTypes: string): void {
        this.dialog.closeAll();

        switch (dialogTypes) {
            case 'clue':
                this.dialog.open(PopupDialogComponent, { closeOnNavigation: true, autoFocus: false, data: ['clue'] });
                break;
            case 'quit':
                this.dialog.open(PopupDialogComponent, { closeOnNavigation: true, autoFocus: false, data: ['quit'] });
                break;
            case 'opponentLeftGame':
                this.dialog.open(PopupDialogComponent, { closeOnNavigation: true, disableClose: true, autoFocus: false, data: ['opponentLeft'] });
        }
    }

    ngOnDestroy(): void {
        this.socketClient.send('leaveRoom');
        this.socket.disconnect();
    }
}
