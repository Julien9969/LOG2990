import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PlayImageLimitedTimeComponent } from '@app/components/play-image/play-image-limited-time/play-image-limited-time.component';
import { PopupDialogComponent } from '@app/components/popup-dialog/popup-dialog.component';
import { CONVERT_TO_MINUTES, SLICE_LAST_INDEX } from '@app/constants/utils-constants';
import { GameService } from '@app/services/game/game.service';
import { HistoryService } from '@app/services/history/history.service';
import { InGameService } from '@app/services/in-game/in-game.service';
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
    gameInfos: Game;

    nDiffFound: number;

    time: string = '';
    nbCluesLeft = 3;

    penalty: number = 0;
    reward: number = 0;
    // eslint-disable-next-line max-params -- Le nombre de paramètres est nécessaire
    constructor(
        private readonly dialog: MatDialog,
        private readonly inGameSocket: InGameService,
        private readonly gameService: GameService,
        private readonly historyService: HistoryService,
    ) {
        this.isLoaded = false;

        this.isSolo = window.history.state.isSolo;
        if (!this.isSolo) {
            this.opponentName = window.history.state.opponentName;
        }
        this.playerName = window.history.state.playerName;
        this.sessionId = window.history.state.sessionId;
    }

    @HostListener('window:keydown.i')
    async handleClueRequest() {
        if (!this.nbCluesLeft || !this.isSolo) return;
        const clue = await this.inGameSocket.retrieveClue();
        this.playImageComponent.handleClue(clue.nbCluesLeft, clue.coordinates);
        this.nbCluesLeft = clue.nbCluesLeft;
    }

    @HostListener('window:beforeunload', ['$event'])
    unloadNotification(event: BeforeUnloadEvent) {
        event.preventDefault();
        this.historyService.setLimitedTimeHistory(this.time);
        event.returnValue = false;
    }

    async ngOnInit(): Promise<void> {
        if (this.sessionId === undefined) {
            // Redirection à la page principale
            const pagePath = window.location.pathname.split('/').slice(0, SLICE_LAST_INDEX);
            window.location.replace(pagePath.join('/'));
        }
        const gameConsts = await this.gameService.getGameConstants();
        const startTime = gameConsts.time as number;
        this.penalty = gameConsts.penalty as number;
        this.reward = gameConsts.reward as number;
        this.time = this.formatTime(startTime);
        this.inGameSocket.retrieveSocketId().then((userSocketId: string) => {
            this.userSocketId = userSocketId;
        });
        this.inGameSocket.listenOpponentLeaves(() => {
            this.historyService.setPlayerQuit(this.time, this.isSolo);
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
        this.historyService.initHistory('Temps limité', this.isSolo);
        this.historyService.setPlayers(this.playerName, this.opponentName);
        this.historyService.gameId = this.sessionId.toString();
    }

    playerExited() {
        this.inGameSocket.playerExited(this.sessionId);
    }

    endGameDialog(timerFinished: boolean) {
        let message = '';
        if (timerFinished) {
            message = `Vous n'avez plus de temps, vous avez trouvé ${this.nDiffFound} différences`;
        } else message = `Vous avez joué à tous les jeux, vous avez trouvé ${this.nDiffFound + 1} différences`;

        this.historyService.setLimitedTimeHistory(this.time);
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
            case 'quit':
                this.dialog.open(PopupDialogComponent, { closeOnNavigation: true, autoFocus: false, data: ['quit'] });
                break;
            case SessionEvents.OpponentLeftGame:
                this.dialog.open(PopupDialogComponent, { closeOnNavigation: true, disableClose: true, autoFocus: false, data: ['opponentLeft'] });
        }
    }

    formatTime(time: number): string {
        return `${Math.floor(time / CONVERT_TO_MINUTES).toString()}:${time % CONVERT_TO_MINUTES}`;
    }

    ngOnDestroy(): void {
        this.playerExited();
        this.historyService.setPlayerQuit(this.time, this.isSolo);
        this.inGameSocket.disconnect();
    }
}
