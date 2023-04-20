import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { TIME_CONST } from '@app/constants/utils-constants';
import { AudioService } from '@app/services/audio/audio.service';
import { CommunicationService } from '@app/services/communication/communication.service';
import { GameActionLoggingService } from '@app/services/gameActionLogging.service';
import { ImageOperationService } from '@app/services/image-operation/image-operation.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { MouseService } from '@app/services/mouse/mouse.service';
import { Coordinate } from '@common/coordinate';
import { GuessResult } from '@common/guess-result';
import { LoggingCodes } from '@common/loggingCodes.event';
@Component({
    selector: 'app-play-image-classic',
    templateUrl: './play-image-classic.component.html',
    styleUrls: ['./play-image-classic.component.scss'],
})
export class PlayImageClassicComponent implements AfterViewInit, OnInit, OnDestroy {
    @ViewChild('canvas1', { static: false }) imageCanvas1!: ElementRef<HTMLCanvasElement>;
    @ViewChild('canvas2', { static: false }) imageCanvas2!: ElementRef<HTMLCanvasElement>;

    @Input() sessionID!: number;
    @Input() imageMainId!: number;
    @Input() imageAltId!: number;
    @Input() isSolo: boolean;

    @Output() diffFoundUpdate: EventEmitter<[string, number][]> = new EventEmitter<[string, number][]>();

    errorMsgPosition: Coordinate;
    errorCounter: number = 0;
    errorGuess: boolean = false;

    // eslint-disable-next-line max-params -- necéssaire pour le fonctionnement
    constructor(
        private readonly mouseService: MouseService,
        private readonly communicationService: CommunicationService,
        private readonly audioService: AudioService,
        public imageOperationService: ImageOperationService,
        private readonly socket: InGameService,
        private loggingService: GameActionLoggingService,
    ) {
        this.imageOperationService.reset();
    }

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

    async handleClue(nbCLuesLeft: number, differencesInOneList: Coordinate[]) {
        this.loggingService.logAction(LoggingCodes.clueLog, { nClueLeft: nbCLuesLeft, diffList: differencesInOneList });
        await this.imageOperationService.handleClue(nbCLuesLeft, differencesInOneList);
    }

    ngOnInit(): void {
        this.errorCounter = 0;
        this.socket.listenDifferenceFound((differenceFound: GuessResult) => {
            this.updateDiffFound(differenceFound);
        });
        this.loggingService.diffFoundFunction = (guessResult: GuessResult) => {
            this.updateDiffFound(guessResult);
        };

        this.loggingService.cheatFunction = async (data: { isStarting: boolean; pixelList: Coordinate[]; diffList: Coordinate[][] }) => {
            await this.imageOperationService.handleCheatReplay(data.isStarting, data.pixelList, data.diffList);
        };
        this.loggingService.getClueFunction = (data: { nClueLeft: number; diffList: Coordinate[] }) => {
            console.log('got there');
            this.handleClue(data.nClueLeft, data.diffList);
        };
    }

    async ngAfterViewInit(): Promise<void> {
        await this.loadImage(this.canvasContext1, this.imageMainId);
        await this.loadImage(this.canvasContext2, this.imageAltId);
        this.imageOperationService.setCanvasContext(this.canvasContext1, this.canvasContext2);
    }
    async reset() {
        this.imageOperationService.reset();
        this.ngOnInit();
        await this.ngAfterViewInit();
    }
    sendPosition(event: MouseEvent): void {
        this.mouseService.clickProcessing(event);
        if (this.isSolo) {
            this.socket
                .submitCoordinatesSolo(this.sessionID, this.mouseService.mousePosition)
                .then((response: GuessResult) => {
                    this.updateDiffFound(response);
                })
                .catch((e) => {
                    alert(e.message);
                });
        } else {
            this.socket.submitCoordinatesMulti(this.sessionID, this.mouseService.mousePosition);
        }
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
            this.imageOperationService.pixelBlink(guessResult.differencePixelList);
        } else {
            this.handleErrorGuess(guessResult.differencePixelList[0]);
        }
    }

    handleErrorGuess(coordinate: Coordinate): void {
        this.errorMsgPosition = coordinate;
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
