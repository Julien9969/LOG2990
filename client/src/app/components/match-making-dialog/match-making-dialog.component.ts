import { AfterViewInit, Component, ElementRef, HostListener, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DELAY_FOCUS, INPUT_VALIDATION } from '@app/constants/utils-constants';
import { MatchMakingService } from '@app/services/match-making/match-making.service';
import { DialogInfos } from '@common/dialog-infos';
import { GameSessionType } from '@common/game-session-type';

/**
 * @titleInject Inject des données lorsqu'on ouvre un dialogue
 */
@Component({
    selector: 'app-name-form-dialog',
    templateUrl: './match-making-dialog.component.html',
    styleUrls: ['./match-making-dialog.component.scss'],
})
export class MatchMakingDialogComponent implements AfterViewInit, OnInit {
    @ViewChild('box') box: ElementRef<HTMLInputElement>;
    playerName: string;
    opponentName: string;
    gameInfo: GameSessionType = this.data;
    dialogInfos: DialogInfos = { template: 'nameForm', message: '' };

    nameFormControl = new FormControl('', [
        Validators.required,
        Validators.maxLength(INPUT_VALIDATION.max),
        Validators.minLength(INPUT_VALIDATION.min),
        Validators.pattern('[a-zA-Z0-9]*'),
    ]);
    private routerLink: string;

    // eslint-disable-next-line max-params -- paramêtres sont nécessaires
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: GameSessionType,
        private dialogRef: MatDialogRef<MatchMakingDialogComponent>,
        private readonly router: Router,
        private matchMaking: MatchMakingService,
    ) {
        this.dialogInfos = { template: 'nameForm', message: '' };
        this.gameInfo = data;
        this.routerLink = this.gameInfo.id === 'limited-time' ? 'limited-time-game' : 'solo-game';
    }

    // Nécessaire pour utiliser window dans le html
    get window() {
        return window;
    }

    @HostListener('window:keydown.enter', ['$event'])
    handleKeyDown(event: KeyboardEvent) {
        event.preventDefault();
        this.validateAndContinue();
    }

    ngOnInit(): void {
        this.router.events.subscribe(() => {
            this.dialogRef.close();
        });
    }

    ngAfterViewInit(): void {
        this.commonMatchMakingFeatures();
        setTimeout(() => {
            this.box.nativeElement.focus();
        }, DELAY_FOCUS);
    }

    async joinGame(): Promise<void> {
        if (!(await this.matchMaking.isSomeOneWaiting(this.gameInfo.id))) {
            this.createGameAndWait();
        } else {
            this.askToJoin();
        }
    }

    async createGameAndWait(): Promise<void> {
        this.dialogInfos.template = 'waitingRoom';

        this.matchMaking.startMatchmaking(this.gameInfo.id);
    }

    askToJoin(): void {
        this.dialogInfos.template = 'waitingRoom';
        this.dialogInfos.message = "Attente d'acceptation par l'adversaire";
        this.matchMaking.joinRoom(this.gameInfo.id, this.playerName);
    }

    async acceptOpponent(): Promise<void> {
        if (await this.matchMaking.acceptOpponent(this.playerName)) {
            if (this.gameInfo.id === 'limited-time') this.matchMaking.startMultiLimitedTimeSession();
            else this.matchMaking.startMultiSession(this.gameInfo.id);
        } else {
            this.dialogInfos.template = 'waitingRoom';
            this.dialogInfos.message = "l'adversaire précendent a quitté la recherche";
        }
    }

    rejectOpponent(): void {
        this.matchMaking.rejectOpponent(this.gameInfo.id, this.playerName);
        this.dialogInfos.template = 'waitingRoom';
        this.dialogInfos.message = '';
    }

    leaveWaiting(): void {
        this.matchMaking.leaveWaiting(this.gameInfo.id);
    }

    validateAndContinue() {
        if (this.dialogInfos.template === 'nameForm') {
            if (this.nameFormControl.valid) {
                if (this.gameInfo.isSolo) this.navigateToSoloGame();
                else this.joinGame();
            }
        } else if (this.dialogInfos.template === 'acceptPairing') {
            this.acceptOpponent();
        }
    }

    navigateToSoloGame(): void {
        const navigationCallback = (newSessionId: number) => {
            this.router.navigateByUrl(this.routerLink, {
                state: { isSolo: true, gameID: this.gameInfo.id, playerName: this.playerName, sessionId: newSessionId },
            });
        };
        if (this.gameInfo.id === 'limited-time') this.matchMaking.startSoloLimitedTimeSession(navigationCallback);
        else this.matchMaking.startSoloSession(this.gameInfo.id, navigationCallback);
    }

    startMultiSession(gameId: string) {
        this.matchMaking.startMultiSession(gameId);
    }

    commonMatchMakingFeatures(): void {
        this.matchMaking.receiveSessionId((id: number) => {
            this.router.navigateByUrl(this.routerLink, {
                state: { isSolo: false, gameID: this.gameInfo.id, playerName: this.playerName, opponentName: this.opponentName, sessionId: id },
            });
        });

        this.matchMaking.onOpponentJoined((opponentName: string) => {
            if (this.gameInfo.id === 'limited-time') {
                this.acceptOpponent();
            }
            this.opponentName = opponentName;
            this.dialogInfos.template = 'acceptPairing';
        });

        this.matchMaking.onOpponentLeft(() => {
            this.dialogInfos.template = 'waitingRoom';
            this.dialogInfos.message = "l'adversaire précendent a quitté la recherche";
        });

        this.matchMaking.onRoomReachable(() => {
            if (this.dialogInfos.template === 'waitingRoom') {
                this.joinGame();
            }
        });

        this.matchMaking.iVeBeenAccepted((opponentName: string) => {
            this.opponentName = opponentName;
        });

        this.matchMaking.iVeBeenRejected((player: string) => {
            this.dialogInfos.template = 'rejected';
            this.opponentName = player;
            this.dialogInfos.message = '';
        });

        this.matchMaking.onGameDeleted(() => {
            this.dialogInfos.template = 'gameDelete';
            this.dialogInfos.message = '';
        });
    }
}
