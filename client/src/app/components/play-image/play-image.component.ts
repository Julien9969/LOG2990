import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AudioService } from '@app/services/audio.service';
import { CommunicationService } from '@app/services/communication.service';
import { ImageOperationService } from '@app/services/image-operation.service';
import { InGameService } from '@app/services/in-game.service';
import { MouseService } from '@app/services/mouse.service';
import { Timer } from '@app/services/timer.service';
import { Coordinate } from '@common/coordinate';
import { GuessResult } from '@common/guess-result';

@Component({
    selector: 'app-play-image',
    templateUrl: './play-image.component.html',
    styleUrls: ['./play-image.component.scss'],
})
export class PlayImageComponent implements AfterViewInit, OnInit {
    @ViewChild('canvas1', { static: false }) imageCanvas1!: ElementRef<HTMLCanvasElement>;
    @ViewChild('canvas2', { static: false }) imageCanvas2!: ElementRef<HTMLCanvasElement>;

    @Input() sessionID!: number;
    @Input() imageMainId!: number;
    @Input() imageAltId!: number;

    @Output() diffFoundUpdate: EventEmitter<[string, number][]> = new EventEmitter<[string, number][]>();

    errorMsgPosition: Coordinate;
    errorCounter: number = 0;
    lastDifferenceFound: GuessResult = {
        isCorrect: false,
        differencesByPlayer: [],
        differencePixelList: [{ x: 0, y: 0 }],
    };

    private timer = new Timer();
    private imageOperationService: ImageOperationService = new ImageOperationService();

    constructor(
        private readonly mouseService: MouseService,
        private readonly communicationService: CommunicationService,
        private readonly audioService: AudioService,
        private readonly socket: InGameService,
    ) {}

    get mouse(): MouseService {
        return this.mouseService;
    }

    get timerService(): Timer {
        return this.timer;
    }

    get canvasContext1(): CanvasRenderingContext2D {
        return this.imageCanvas1.nativeElement.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
    }

    get canvasContext2(): CanvasRenderingContext2D {
        return this.imageCanvas2.nativeElement.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
    }

    ngOnInit(): void {
        this.errorCounter = 0;
        this.lastDifferenceFound = {
            isCorrect: false,
            differencesByPlayer: [],
            differencePixelList: [{ x: 0, y: 0 }],
        };
        // Sert a savoir lorsque notre adversaire trouve une nouvelle différence
        this.socket.receiveDifferenceFound().subscribe((differenceFound: GuessResult) => {
            this.updateDiffFound(differenceFound);
        });
    }

    ngAfterViewInit(): void {
        this.imageOperationService.setCanvasContext(this.canvasContext1, this.canvasContext2);
        this.loadImage(this.canvasContext1, this.imageMainId);
        this.loadImage(this.canvasContext2, this.imageAltId);
    }

    sendPosition(event: MouseEvent): void {
        if (this.timer.errorGuess) {
            return;
        }
        this.mouseService.clickProcessing(event);
        this.socket
            .submitCoordinates(this.sessionID, this.mouseService.mousePosition)
            .then((response: GuessResult) => {
                this.updateDiffFound(response);
            })
            .catch((e) => {
                alert(e.message);
            });
    }

    /**
     * Met a jours les scores lorsque l'utilisateur locale trouve une différence
     *
     * @param guessResult résultat du serveur après avoir demander de valider les coordonnés de la différence trouvé
     */
    updateDiffFound(guessResult: GuessResult): void {
        if (guessResult.isCorrect && this.hasNbDifferencesChanged(guessResult.differencesByPlayer)) {
            this.lastDifferenceFound = guessResult;
            this.audioService.playAudio('success');
            this.diffFoundUpdate.emit(this.lastDifferenceFound.differencesByPlayer);
            this.errorCounter = 0;
            this.imageOperationService.pixelBlink(guessResult.differencePixelList);
        } else {
            this.handleErrorGuess();
        }
    }

    handleErrorGuess(): void {
        this.errorMsgPosition = { x: this.mouseService.mousePosition.x, y: this.mouseService.mousePosition.y };
        this.timer.errorTimer();
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

    hasNbDifferencesChanged(differencesByPlayer: [userSocketId: string, nDifferences: number][]): boolean {
        if (this.lastDifferenceFound.differencesByPlayer.length < differencesByPlayer.length) {
            return true;
        }
        if (this.lastDifferenceFound.differencesByPlayer.length === differencesByPlayer.length) {
            for (let i = 0; i < differencesByPlayer.length; i++) {
                if (this.lastDifferenceFound.differencesByPlayer[i][1] !== differencesByPlayer[i][1]) {
                    return true;
                }
            }
        }
        return false;
    }
}
