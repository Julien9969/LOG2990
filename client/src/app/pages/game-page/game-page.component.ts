import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PlayImageClassicComponent } from '@app/components/play-image/play-image-classic/play-image-classic.component';
import { PopupDialogComponent } from '@app/components/popup-dialog/popup-dialog.component';
import { SLICE_LAST_INDEX } from '@app/constants/utils-constants';
import { CommunicationService } from '@app/services/communication/communication.service';
import { GameActionLoggingService } from '@app/services/game-action-logging/gameActionLogging.service';
import { GameService } from '@app/services/game/game.service';
import { HistoryService } from '@app/services/history/history.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { Game } from '@common/game';
import { SessionEvents } from '@common/session.gateway.events';
import { WinnerInfo } from '@common/winner-info';
@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit, OnDestroy {
    @ViewChild(PlayImageClassicComponent) playImageComponent: PlayImageClassicComponent;
    // @ViewChild('appPlayImage') playImageComponent: PlayImageClassicComponent;
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
    nbCluesLeft = 3;
    penalty: number = 0;

    // eslint-disable-next-line max-params -- Le nombre de paramètres est nécessaire
    constructor(
        private readonly dialog: MatDialog,
        private readonly communicationService: CommunicationService,
        private readonly socketClient: SocketClientService,
        private loggingService: GameActionLoggingService,
        private readonly inGameSocket: InGameService,
        private readonly historyService: HistoryService,
        private readonly gameService: GameService,
    ) {
        this.isLoaded = false;
        this.isSolo = window.history.state.isSolo;
        if (!this.isSolo) {
            this.opponentName = window.history.state.opponentName;
        }
        this.playerName = window.history.state.playerName;
        this.sessionId = window.history.state.sessionId;
        this.gameID = window.history.state.gameID;
        this.loggingService.isRecording = true;
    }

    @HostListener('window:beforeunload', ['$event'])
    unloadHandler(event: BeforeUnloadEvent) {
        event.preventDefault();
        this.historyService.playerQuit(this.time, this.isSolo);
        event.returnValue = false;
    }

    @HostListener('window:keydown.i')
    async handleClueRequest() {
        if (!this.nbCluesLeft || !this.isSolo) return;
        const clue = await this.inGameSocket.retrieveClue();
        this.playImageComponent.handleClue(clue.nbCluesLeft, clue.coordinates);
        this.nbCluesLeft = clue.nbCluesLeft;
    }

    async ngOnInit(): Promise<void> {
        if (this.sessionId === undefined || this.gameID === undefined) {
            // Redirection à la page principale
            const pagePath = window.location.pathname.split('/').slice(0, SLICE_LAST_INDEX);
            window.location.replace(pagePath.join('/'));
        }
        this.getGameInfos();
        this.inGameSocket.retrieveSocketId().then((userSocketId) => {
            this.userSocketId = userSocketId;
        });
        this.inGameSocket.listenOpponentLeaves(() => {
            this.historyService.playerQuit(this.time);
            this.openDialog(SessionEvents.OpponentLeftGame);
        });
        this.inGameSocket.listenPlayerWon((winnerInfo: WinnerInfo) => {
            this.endGameDialog(winnerInfo);
        });
        this.inGameSocket.listenTimerUpdate((time: string) => {
            this.time = time;
        });
        this.loggingService.timerUpdateFunction = (time: string) => {
            this.time = time;
        };

        this.inGameSocket.listenProvideName(this.playerName);

        this.initHistory();
        this.penalty = (await this.gameService.getGameConstants()).penalty ?? 0;
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
        this.inGameSocket.playerExited(this.sessionId);
    }

    endGameDialog(winnerInfo: WinnerInfo) {
        let message = '';
        if (winnerInfo.socketId === this.userSocketId) {
            message = this.isSolo ? `Bravo! Vous avez gagné avec un temps de ${this.time}` : `Vous avez gagné, ${winnerInfo.name} est le vainqueur`;
            this.historyService.playerWon(this.time);
        } else message = `Vous avez perdu, ${winnerInfo.name} remporte la victoire`;
        this.dialog.closeAll();
        this.dialog.open(PopupDialogComponent, {
            closeOnNavigation: true,
            disableClose: true,
            autoFocus: false,
            data: ['endGame', message, { gameId: this.gameID, playerName: this.playerName }],
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
    async replay() {
        await this.playImageComponent.reset();
        this.inGameSocket.socketService.loggingService.replayAllAction();
    }
    ngOnDestroy(): void {
        this.playerExited();
        this.socketClient.send(SessionEvents.LeaveRoom);
        this.inGameSocket.disconnect();
    }

    private initHistory() {
        this.historyService.initHistory();
        this.historyService.setPlayers(this.playerName, this.opponentName);
        this.historyService.gameId = this.gameID;
        this.historyService.setGameMode('TODO', this.isSolo);
    }
}
