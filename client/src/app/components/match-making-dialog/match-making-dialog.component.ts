import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { INPUT_VALIDATION } from '@app/constants/utils-constants';
import { CommunicationService } from '@app/services/communication.service';
import { MatchMakingService } from '@app/services/match-making.service';
import { GameSessionType } from '@common/game-session-type';

/**
 * @title Injecting data when opening a dialog
 */
@Component({
    selector: 'app-name-form-dialog',
    templateUrl: './match-making-dialog.component.html',
    styleUrls: ['./match-making-dialog.component.scss'],
})
export class MatchMakingDialogComponent implements AfterViewInit, OnInit {
    playerName: string;
    opponentName: string;
    gameInfo: GameSessionType;
    dialogInfos: { template: string; message: string } = { template: 'nameForm', message: '' };

    nameFormControl = new FormControl('', [
        Validators.required,
        Validators.maxLength(INPUT_VALIDATION.max),
        Validators.minLength(INPUT_VALIDATION.min),
        Validators.pattern('[a-zA-Z0-9]*'),
    ]);
    private readonly routerLink = 'solo-game';

    // eslint-disable-next-line max-params -- params are needed
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: GameSessionType,
        private dialogRef: MatDialogRef<MatchMakingDialogComponent>,
        private readonly router: Router,
        private readonly communicationService: CommunicationService,
        public matchMaking: MatchMakingService,
    ) {
        this.gameInfo = data;
    }

    ngOnInit(): void {
        this.router.events.subscribe(() => {
            this.dialogRef.close();
        });

        window.addEventListener('beforeunload', () => {
            this.matchMaking.leaveWaiting(this.gameInfo.id);
        });
    }

    ngAfterViewInit(): void {
        this.matchMaking.connect();
        this.commonMatchMakingFeatures();
    }

    async joinGame(): Promise<void> {
        if (!(await this.matchMaking.someOneWaiting(this.gameInfo.id))) {
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

        this.matchMaking.iVeBeenAccepted((opponentName: string) => {
            this.opponentName = opponentName;
        });

        this.matchMaking.iVeBeenRejected((player: string) => {
            this.dialogInfos.template = 'rejected';
            this.opponentName = player;
            this.dialogInfos.message = '';
        });
    }

    async acceptOpponent(): Promise<void> {
        if (await this.matchMaking.acceptOpponent(this.playerName)) {
            this.matchMaking.askForSessionId(this.gameInfo.id);
        } else {
            this.dialogInfos.template = 'waitingRoom';
            this.dialogInfos.message = "l'adversaire précendent a quitté la recherche";
        }
    }

    rejectOpponent(): void {
        this.matchMaking.rejectOpponent(this.gameInfo.id, this.playerName);
        this.dialogInfos.template = 'waitingRoom';
    }

    leaveWaiting(): void {
        this.matchMaking.leaveWaiting(this.gameInfo.id);
    }

    navigateToMultiGame(sessionID: number): void {
        this.router.navigateByUrl(this.routerLink, {
            state: { isSolo: false, gameID: this.gameInfo.id, playerName: this.playerName, opponentName: this.opponentName, sessionId: sessionID },
        });
    }

    navigateToSoloGame(): void {
        this.communicationService.customPost(`session/${this.gameInfo.id}`).subscribe((response) => {
            const sessionID = response as number;
            this.router.navigateByUrl(this.routerLink, {
                state: { isSolo: true, gameID: this.gameInfo.id, playerName: this.playerName, sessionId: sessionID },
            });
        });
    }

    commonMatchMakingFeatures(): void {
        this.matchMaking.sessionIdReceived((sessionId: number) => {
            // eslint-disable-next-line no-console
            console.log('Session id received ' + sessionId);
            this.navigateToMultiGame(sessionId);
        });

        this.matchMaking.opponentJoined((opponentName: string) => {
            this.opponentName = opponentName;
            this.dialogInfos.template = 'acceptPairing';
        });

        this.matchMaking.socketService.on('opponentLeft', () => {
            this.dialogInfos.template = 'waitingRoom';
            this.dialogInfos.message = "l'adversaire précendent a quitté la recherche";
        });

        this.matchMaking.socketService.on('roomReachable', () => {
            if (this.dialogInfos.template === 'waitingRoom') {
                this.joinGame();
            }
        });
    }
}
