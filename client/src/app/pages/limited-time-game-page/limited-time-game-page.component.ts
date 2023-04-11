import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PopupDialogComponent } from '@app/components/popup-dialog/popup-dialog.component';
import { InGameService } from '@app/services/in-game.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { Game } from '@common/game';
import { SessionEvents } from '@common/session.gateway.events';

@Component({
    selector: 'app-limited-time-game-page',
    templateUrl: './limited-time-game-page.component.html',
    styleUrls: ['./limited-time-game-page.component.scss'],
})
export class LimitedTimeGamePageComponent implements OnInit, OnDestroy {
    userSocketId: string;

    playerName: string;
    opponentName: string;
    isLoaded: boolean;
    isSolo: boolean;

    sessionId: number;
    // gameID: string;
    gameInfos: Game;

    nDiffFound: number;

    time: string = '2:00';

    // eslint-disable-next-line max-params -- Le nombre de paramètres est nécessaire
    constructor(
        private readonly dialog: MatDialog,
        // private readonly communicationService: CommunicationService,
        private readonly socket: InGameService,
        private readonly socketClient: SocketClientService,
    ) {
        this.isLoaded = false;

        this.isSolo = window.history.state.isSolo;
        if (!this.isSolo) {
            this.opponentName = window.history.state.opponentName;
        }
        this.playerName = window.history.state.playerName;
        this.sessionId = window.history.state.sessionId;
        // this.gameID = window.history.state.gameID;
    }

    @HostListener('window:beforeunload', ['$event'])
    unloadNotification($event: Event) {
        // eslint-disable-next-line deprecation/deprecation
        $event.returnValue = true; // L'équivalent non déprécié ne produit pas le même résultat
    }

    async ngOnInit(): Promise<void> {
        if (this.sessionId === undefined) {
            window.location.replace('/home');
        }
        // this.getGameInfos();
        this.socket.retrieveSocketId().then((userSocketId) => {
            this.userSocketId = userSocketId;
        });
        this.socket.listenOpponentLeaves(() => {
            this.isSolo = true;
        });
        this.socket.listenGameEnded((timerFinished: boolean) => {
            this.endGameDialog(timerFinished);
        });
        this.socket.listenTimerUpdate((time: string) => {
            this.time = time;
        });
        this.socket.listenProvideName(this.playerName);
        this.socket.listenNewGame((data: [Game, number]) => {
            console.log('LT page got called on New Game');
            this.nDiffFound = data[1];
        });
    }

    playerExited() {
        this.socket.playerExited(this.sessionId);
    }

    endGameDialog(timerFinished: boolean) {
        let message = '';
        if (timerFinished) {
            message = `Vous n'avez plus de temps, vous avez trouvé ${this.nDiffFound} différences`;
        } else message = `Vous avez joué à tous les jeux, vous avez trouvé ${this.nDiffFound + 1} différences`;
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
            case SessionEvents.OpponentLeftGame:
                this.dialog.open(PopupDialogComponent, { closeOnNavigation: true, disableClose: true, autoFocus: false, data: ['opponentLeft'] });
        }
    }

    ngOnDestroy(): void {
        this.playerExited();
        this.socketClient.send(SessionEvents.LeaveRoom);
        this.socket.disconnect();
    }
}
