import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PlayImageComponent } from '@app/components/play-image/play-image.component';
import { PopupDialogComponent } from '@app/components/popup-dialog/popup-dialog.component';
import { CommunicationService } from '@app/services/communication.service';
import { GameActionLoggingService } from '@app/services/gameActionLogging.service';
import { InGameService } from '@app/services/in-game.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { Game } from '@common/game';
import { SessionEvents } from '@common/session.gateway.events';
import { WinnerInfo } from '@common/winner-info';
@Component({
    selector: 'app-replay-page',
    templateUrl: './replay-page.component.html',
    styleUrls: ['./replay-page.component.scss'],
})
export class ReplayPageComponent implements OnInit, OnDestroy {
    @ViewChild(PlayImageComponent) playImageComponent: PlayImageComponent;
    userSocketId: string;

    playerName: string;
    opponentName: string;
    isLoaded: boolean;
    isSolo: boolean;

    sessionId: number;
    gameID: string;
    gameInfos: Game;

    nDiffFoundMainPlayer: number = 0;
    nDiffFoundOpponent: number = 0;

    time: string = '0:00';

    // eslint-disable-next-line max-params -- Le nombre de paramètres est nécessaire
    constructor(
        private readonly dialog: MatDialog,
        private readonly communicationService: CommunicationService,
        readonly socket: InGameService,
        private readonly socketClient: SocketClientService,
        private loggingService: GameActionLoggingService,
    ) {
        this.isLoaded = false;
        this.isSolo = window.history.state.isSolo;
        if (!this.isSolo) {
            this.opponentName = window.history.state.opponentName;
        }
        this.playerName = window.history.state.playerName;
        this.sessionId = window.history.state.sessionId;
        this.gameID = window.history.state.gameID;
    }

    @HostListener('window:beforeunload', ['$event'])
    unloadNotification($event: Event) {
        // eslint-disable-next-line deprecation/deprecation
        $event.returnValue = true; // L'équivalent non déprécié ne produit pas le même résultat
    }

    async ngOnInit(): Promise<void> {
        /* if (this.sessionId === undefined || this.gameID === undefined) {
            window.location.replace('/replay');
        }*/
        this.getGameInfos();
        this.socket.retrieveSocketId().then((userSocketId) => {
            this.userSocketId = userSocketId;
        });
        this.socket.listenOpponentLeaves(() => {
            this.openDialog(SessionEvents.OpponentLeftGame);
        });
        this.socket.listenPlayerWon((winnerInfo: WinnerInfo) => {
            this.endGameDialog(winnerInfo);
        });
        this.socket.listenTimerUpdate((time: string) => {
            this.time = time;
        });
        this.loggingService.timerUpdateFunction = (time: string) => {
            this.time = time;
        };
        this.socket.listenProvideName(this.playerName);
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
        this.socket.playerExited(this.sessionId);
    }

    endGameDialog(winnerInfo: WinnerInfo) {
        let message = '';
        if (winnerInfo.socketId === this.userSocketId) {
            message = this.isSolo ? `Bravo! Vous avez gagné avec un temps de ${this.time}` : `Vous avez gagné, ${winnerInfo.name} est le vainqueur`;
        } else message = `Vous avez perdu, ${winnerInfo.name} remporte la victoire`;
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
    async replay() {
        await this.playImageComponent.reset();
        this.socket.socketService.loggingService.replayAllAction();
    }
    ngOnDestroy(): void {
        this.playerExited();
        this.socketClient.send(SessionEvents.LeaveRoom);
        this.socket.disconnect();
    }
}
