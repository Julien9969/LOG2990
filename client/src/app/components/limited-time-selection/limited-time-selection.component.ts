import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatchMakingDialogComponent } from '@app/components/match-making-dialog/match-making-dialog.component';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { MatchMakingEvents } from '@common/match-making.gateway.events';

/**
 * @title Inject des données lorsqu'on ouvre un dialogue
 */
@Component({
    selector: 'app-limited-time-selection',
    templateUrl: './limited-time-selection.component.html',
    styleUrls: ['./limited-time-selection.component.scss'],
})
export class LimitedTimeSelectionComponent implements OnInit {
    templateName: string = 'gameSelection';

    // eslint-disable-next-line max-params -- Paramètres sont nécessaires
    constructor(
        private readonly dialog: MatDialog,
        private socketService: SocketClientService,
        private dialogRef: MatDialogRef<LimitedTimeSelectionComponent>,
        private readonly router: Router,
    ) {}

    ngOnInit(): void {
        this.socketService.connect();

        this.router.events.subscribe(() => {
            this.dialogRef.close();
        });
    }

    getIfGameExist(): void {
        this.socketService.send(MatchMakingEvents.AnyGamePlayable, (gameExist: boolean) => {
            if (!gameExist) {
                this.templateName = 'noGame';
            }
        });
    }

    openMatchMaking(isSolo: boolean): void {
        const gameInfo = { isSolo, id: 'limited-time' };
        this.dialog.open(MatchMakingDialogComponent, { closeOnNavigation: true, disableClose: true, autoFocus: false, data: gameInfo });
    }
}
