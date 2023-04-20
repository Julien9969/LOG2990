import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PlayImageClassicComponent } from '@app/components/play-image-classic/play-image-classic.component';
import { PopupDialogComponent } from '@app/components/popup-dialog/popup-dialog.component';
import { CommunicationService } from '@app/services/communication/communication.service';
import { GameActionLoggingService } from '@app/services/gameActionLogging.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { Game } from '@common/game';
import { SessionEvents } from '@common/session.gateway.events';
import { WinnerInfo } from '@common/winner-info';
@Component({
    selector: 'app-replay-page',
    templateUrl: './replay-page.component.html',
    styleUrls: ['./replay-page.component.scss'],
})
export class ReplayPageComponent implements OnInit, OnDestroy {
    @ViewChild(PlayImageClassicComponent) playImageComponent: PlayImageClassicComponent;
    userSocketId: string;
    playerName: string;
    opponentName: string;
    isLoaded: boolean;
    isSolo: boolean;

    sessionId: number;
    gameId: string;
    gameInfos: Game;
    speed: number = 1;
    wasCheatBlinkingBeforePause: boolean;

    nDiffFoundMainPlayer: number = 0;
    nDiffFoundOpponent: number = 0;

    time: string = '0:00';

    // eslint-disable-next-line max-params -- Le nombre de paramètres est nécessaire
    constructor(
        public loggingService: GameActionLoggingService,
        private readonly dialog: MatDialog,
        private readonly communicationService: CommunicationService,
        readonly socket: InGameService,
        private readonly socketClient: SocketClientService,
    ) {
        this.isLoaded = false;
        this.isSolo = window.history.state.isSolo;
        if (!this.isSolo) {
            this.opponentName = window.history.state.opponentName;
        }
        this.playerName = window.history.state.playerName;
        this.gameId = window.history.state.gameId;
        this.replay();
    }

    @HostListener('window:beforeunload', ['$event'])
    unloadNotification($event: Event) {
        // eslint-disable-next-line deprecation/deprecation
        $event.returnValue = true; // L'équivalent non déprécié ne produit pas le même résultat
    }

    async ngOnInit(): Promise<void> {
        if (this.gameId === undefined) {
            window.location.replace('/home');
        }
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
        this.communicationService.gameInfoGet(this.gameId).subscribe({
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
    replay() {
        this.loggingService.clearReplayAll();
        this.loggingService.replayAllAction();
    }
    async resetAndReplay() {
        this.setReplaySpeed(this.speed);
        await this.playImageComponent.reset();
        this.playImageComponent.imageOperationService.clearAllIntervals();
        this.replay();
    }
    setReplaySpeed(newSpeed: number) {
        if (newSpeed !== 0) {
            this.speed = newSpeed;
        }
        this.loggingService.speedMultiplier = newSpeed;
        this.handleUnpause();
    }
    handleUnpause() {
        if (this.wasCheatBlinkingBeforePause && this.loggingService.speedMultiplier !== 0) {
            this.playImageComponent.imageOperationService.cheatBlink();
            this.wasCheatBlinkingBeforePause = false;
        }
    }
    pause() {
        if (this.loggingService.speedMultiplier === 0) {
            this.setReplaySpeed(this.speed);
            return;
        }
        if (this.playImageComponent.imageOperationService.cheatInterval) {
            this.wasCheatBlinkingBeforePause = true;
        }
        this.playImageComponent.imageOperationService.clearAllIntervals();
        this.speed = this.loggingService.speedMultiplier;
        this.setReplaySpeed(0);
    }
    ngOnDestroy(): void {
        this.playerExited();
        this.socketClient.send(SessionEvents.LeaveRoom);
        this.socket.disconnect();
    }
}
