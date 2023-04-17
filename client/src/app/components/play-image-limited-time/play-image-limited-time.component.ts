import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { TIME_CONST } from '@app/constants/utils-constants';
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
    templateUrl: './play-image-limited-time.component.html',
    styleUrls: ['./play-image-limited-time.component.scss'],
})
export class PlayImageLimitedTimeComponent implements AfterViewInit, OnInit, OnDestroy {
    @ViewChild('canvas1', { static: false }) imageCanvas1!: ElementRef<HTMLCanvasElement>;
    @ViewChild('canvas2', { static: false }) imageCanvas2!: ElementRef<HTMLCanvasElement>;

    @Input() sessionID!: number;
    @Input() imageMainId!: number;
    @Input() imageAltId!: number;
    @Input() isTimeLimited: boolean = false;

    @Output() diffFoundUpdate: EventEmitter<[string, number][]> = new EventEmitter<[string, number][]>();

    errorMsgPosition: Coordinate;
    errorCounter: number = 0;

    errorGuess: boolean = false;

    // eslint-disable-next-line max-params -- necéssaire pour le fonctionnement
    constructor(
        private readonly mouseService: MouseService,
        private readonly communicationService: CommunicationService,
        private readonly audioService: AudioService,
        private readonly imageOperationService: ImageOperationService,
        private readonly socket: InGameService,
    ) {}

    get mouse(): MouseService {
        return this.mouseService;
    }

    get canvasContext1(): CanvasRenderingContext2D {
        return this.imageCanvas1.nativeElement.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
    }

    get canvasContext2(): CanvasRenderingContext2D {
        return this.imageCanvas2.nativeElement.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
    }

    @HostListener('window:keydown.t', ['$event'])
    async handleCheat() {
        await this.imageOperationService.handleCheat(this.sessionID);
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

    async ngAfterViewInit(): Promise<void> {
        await this.loadImage(this.canvasContext1, this.imageMainId);
        await this.loadImage(this.canvasContext2, this.imageAltId);
        this.imageOperationService.setCanvasContext(this.canvasContext1, this.canvasContext2);
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
            this.handleErrorGuess();
        }
    }

    async receiveNewGame(newGame: Game) {
        try {
            if (!newGame) return;
            this.imageMainId = newGame.imageMain;
            this.imageAltId = newGame.imageAlt;
            await this.loadImage(this.canvasContext1, this.imageMainId);
            await this.loadImage(this.canvasContext2, this.imageAltId);
            this.imageOperationService.setCanvasContext(this.canvasContext1, this.canvasContext2);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            alert(error.message);
        }
    }

    handleErrorGuess(): void {
        this.errorMsgPosition = { x: this.mouseService.mousePosition.x, y: this.mouseService.mousePosition.y };
        this.errorGuess = true;
        window.setTimeout(() => {
            this.errorGuess = false;
        }, TIME_CONST.secondInMillisecond);
        this.errorCounter++;

        if (this.errorCounter % 3 === 0) {
            this.audioService.playAudio('manyErrors');
            this.errorCounter = 0;
        } else {
            this.audioService.playAudio('error');
        }
    }

    async loadImage(canvasContext: CanvasRenderingContext2D, imageId: number): Promise<void> {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        return new Promise<void>((done) => {
            img.onload = async () => {
                this.drawImageOnCanvas(canvasContext, img);
                return done();
            };
            img.src = this.communicationService.getImageURL(imageId);
        });
    }

    drawImageOnCanvas(canvasContext: CanvasRenderingContext2D, img: HTMLImageElement): void {
        canvasContext.drawImage(img, 0, 0);
    }

    ngOnDestroy(): void {
        this.imageOperationService.disableCheat();
    }
}
