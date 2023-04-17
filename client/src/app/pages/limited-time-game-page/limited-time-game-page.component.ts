import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PlayImageLimitedTimeComponent } from '@app/components/play-image-limited-time/play-image-limited-time.component';
import { PopupDialogComponent } from '@app/components/popup-dialog/popup-dialog.component';
import { TIME_CONST } from '@app/constants/utils-constants';
import { GameService } from '@app/services/game/game.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { Game } from '@common/game';
import { SessionEvents } from '@common/session.gateway.events';

@Component({
    selector: 'app-limited-time-game-page',
    templateUrl: './limited-time-game-page.component.html',
    styleUrls: ['./limited-time-game-page.component.scss'],
})
export class LimitedTimeGamePageComponent implements OnInit, OnDestroy {
    @ViewChild('appPlayImage') playImageComponent: PlayImageLimitedTimeComponent;

    userSocketId: string;

    playerName: string;
    opponentName: string;
    isLoaded: boolean;
    isSolo: boolean;

    sessionId: number;
    // gameID: string;
    gameInfos: Game;

    nDiffFound: number;

    time: string = '';
    nbCluesLeft = 3;

    penalty: number = 0;

    // eslint-disable-next-line max-params -- Le nombre de paramètres est nécessaire
    constructor(
        private readonly dialog: MatDialog,
        // private readonly communicationService: CommunicationService,
        private readonly inGameSocket: InGameService,
        private readonly socketClient: SocketClientService,
        private readonly gameService: GameService,
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

    @HostListener('window:keydown.i')
    async handleClueRequest() {
        if (!this.nbCluesLeft || !this.isSolo) return;
        const clue = await this.inGameSocket.retrieveClue();
        this.playImageComponent.handleClue(clue.nbCluesLeft, clue.coordinates);
        this.nbCluesLeft = clue.nbCluesLeft;
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
        const gameConsts = await this.gameService.getGameConstants();
        const startTime = gameConsts.time as number;
        this.penalty = gameConsts.penalty as number;
        this.time = this.formatTime(startTime);
        // this.getGameInfos();
        this.inGameSocket.retrieveSocketId().then((userSocketId: string) => {
            this.userSocketId = userSocketId;
        });
        this.inGameSocket.listenOpponentLeaves(() => {
            this.isSolo = true;
        });
        this.inGameSocket.listenGameEnded((timerFinished: boolean) => {
            this.endGameDialog(timerFinished);
        });
        this.inGameSocket.listenTimerUpdate((time: string) => {
            this.time = time;
        });
        this.inGameSocket.listenProvideName(this.playerName);
        this.inGameSocket.listenNewGame((data: [Game, number]) => {
            this.nDiffFound = data[1];
        });
    }

    playerExited() {
        this.inGameSocket.playerExited(this.sessionId);
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

    formatTime(time: number): string {
        return `${Math.floor(time / TIME_CONST.minute).toString()}:${time % TIME_CONST.minute}`;
    }

    ngOnDestroy(): void {
        this.playerExited();
        this.socketClient.send(SessionEvents.LeaveRoom);
        this.inGameSocket.disconnect();
    }
}
