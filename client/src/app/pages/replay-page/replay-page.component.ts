import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PlayImageClassicComponent } from '@app/components/play-image/play-image-classic/play-image-classic.component';
import { PopupDialogComponent } from '@app/components/popup-dialog/popup-dialog.component';
import { GameActionLoggingService } from '@app/services/game-action-logging/game-action-logging.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { Game } from '@common/game';
@Component({
    selector: 'app-replay-page',
    templateUrl: './replay-page.component.html',
    styleUrls: ['./replay-page.component.scss'],
})
export class ReplayPageComponent implements OnInit, OnDestroy {
    @ViewChild(PlayImageClassicComponent) playImageComponent: PlayImageClassicComponent;
    playerName: string;
    opponentName: string;
    isLoaded: boolean;

    sessionId: number;
    gameInfos: Game;

    nDiffFoundMainPlayer: number = 0;
    nDiffFoundOpponent: number = 0;

    time: string = '0:00';
    speed: number = 1;

    private gameId: string;
    private wasCheatBlinkingBeforePause: boolean;

    // eslint-disable-next-line max-params -- Le nombre de paramètres est nécessaire
    constructor(public loggingService: GameActionLoggingService, private readonly dialog: MatDialog, readonly socket: InGameService) {
        this.isLoaded = false;
        this.playerName = window.history.state.playerName;
        this.gameId = window.history.state.gameId;
        this.replay();
    }

    async ngOnInit(): Promise<void> {
        if (this.gameId === undefined) {
            window.location.replace('/home');
        }
        this.getGameInfos();

        this.loggingService.timerUpdateFunction = (time: string) => {
            this.time = time;
        };
    }

    getGameInfos(): void {
        this.gameInfos = this.loggingService.gameInfos;
        this.isLoaded = true;
    }

    openDialog(dialogTypes: string): void {
        this.dialog.closeAll();

        if (dialogTypes === 'quit') {
            this.dialog.open(PopupDialogComponent, { closeOnNavigation: true, autoFocus: false, data: ['quit'] });
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
        this.socket.disconnect();
    }
}
