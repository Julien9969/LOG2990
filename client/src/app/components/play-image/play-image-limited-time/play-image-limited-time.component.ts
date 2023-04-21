import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { PlayImage } from '@app/components/play-image/play-image';
import { AudioService } from '@app/services/audio/audio.service';
import { CommunicationService } from '@app/services/communication/communication.service';
import { ImageOperationService } from '@app/services/image-operation/image-operation.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { MouseService } from '@app/services/mouse/mouse.service';
import { Coordinate } from '@common/coordinate';
import { Game } from '@common/game';
import { GuessResult } from '@common/guess-result';

@Component({
    selector: 'app-play-image-limited-time',
    templateUrl: '../play-image.component.html',
    styleUrls: ['../play-image.component.scss'],
})
export class PlayImageLimitedTimeComponent extends PlayImage implements AfterViewInit, OnInit, OnDestroy {
    @ViewChild('canvas1', { static: false }) imageCanvas1!: ElementRef<HTMLCanvasElement>;
    @ViewChild('canvas2', { static: false }) imageCanvas2!: ElementRef<HTMLCanvasElement>;

    @Input() sessionID!: number;
    @Input() imageMainId!: number;
    @Input() imageAltId!: number;

    @Output() diffFoundUpdate: EventEmitter<[string, number][]> = new EventEmitter<[string, number][]>();

    errorMsgPosition: Coordinate;

    // eslint-disable-next-line max-params -- necéssaire pour le fonctionnement
    constructor(
        protected readonly mouseService: MouseService,
        protected readonly communicationService: CommunicationService,
        protected readonly audioService: AudioService,
        protected readonly imageOperationService: ImageOperationService,
        protected readonly socket: InGameService,
    ) {
        super(mouseService, communicationService, audioService, imageOperationService, socket);
    }

    async handleClue(nbCLuesLeft: number, differencesInOneList: Coordinate[]) {
        await this.imageOperationService.handleClue(nbCLuesLeft, differencesInOneList);
    }

    ngOnInit(): void {
        this.errorCounter = 0;
        this.socket.listenDifferenceFound((differenceFound: GuessResult) => {
            this.updateDiffFound(differenceFound);
        });
        this.socket.listenNewGame((data: [Game, number]) => {
            this.receiveNewGame(data[0]);
        });
    }

    sendPosition(event: MouseEvent): void {
        this.mouseService.clickProcessing(event);
        this.submitLimitedTimeCoordinates();
    }

    submitLimitedTimeCoordinates() {
        this.socket.submitCoordinatesLimitedTime(this.sessionID, this.mouseService.mousePosition);
    }

    /**
     * Met a jours les scores lorsque l'utilisateur locale trouve une différence
     *
     * @param guessResult résultat du serveur après avoir demander de valider les coordonnés de la différence trouvé
     */
    updateDiffFound(guessResult: GuessResult): void {
        if (guessResult.isCorrect) {
            this.audioService.playAudio('success');
            this.diffFoundUpdate.emit(guessResult.differencesByPlayer);
            this.errorCounter = 0;
        } else {
            this.handleErrorGuess(guessResult.differencePixelList[0]);
        }
    }

    async receiveNewGame(newGame: Game) {
        if (newGame) {
            this.imageMainId = newGame.imageMain;
            this.imageAltId = newGame.imageAlt;
            await this.loadImage(this.canvasContext1, this.imageMainId);
            await this.loadImage(this.canvasContext2, this.imageAltId);
            this.imageOperationService.setCanvasContext(this.canvasContext1, this.canvasContext2);
        }
    }

    async ngAfterViewInit(): Promise<void> {
        await this.afterViewInit();
    }

    ngOnDestroy(): void {
        this.onDestroy();
    }
}
