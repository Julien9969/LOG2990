import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { GuessResult } from '@common/guess-result';
import { Coordinate } from '@common/coordinate';
import { CommunicationService } from '@app/services/communication.service';
import { ImageOperationService } from '@app/services/image-operation.service';
import { MouseService } from '@app/services/mouse.service';
import { Timer } from '@app/services/timer.service';

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
    @Output() diffFound: EventEmitter<string> = new EventEmitter<string>();
    audioPlayer = new Audio();
    errorMsgPosition: Coordinate;
    errorCounter: number = 0;

    private timer = new Timer();
    private imageOperationService: ImageOperationService = new ImageOperationService();

    constructor(private readonly mouseService: MouseService, private readonly communicationService: CommunicationService) {}

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
    }

    ngAfterViewInit(): void {
        this.setCanvasToImageOperationService();
        this.loadImage(this.canvasContext1, this.imageMainId);
        this.loadImage(this.canvasContext2, this.imageAltId);
    }

    sendDiffFound() {
        this.diffFound.emit('data');
    }

    setCanvasToImageOperationService(): void {
        this.imageOperationService.originalImgContext = this.canvasContext1;
        this.imageOperationService.modifiedImgContext = this.canvasContext2;
    }

    sendPosition(event: MouseEvent): void {
        if (this.timer.errorGuess) {
            return;
        }
        this.mouseService.clickProcessing(event);

        this.communicationService.sendCoordinates(this.sessionID, this.mouseService.mousePosition).subscribe({
            next: (response) => {
                const guessResult = response.body as GuessResult;
                this.isRightDiff(guessResult);
            },
            error: () => {
                const responseString = 'Le serveur ne répond pas';
                alert(responseString);
            },
        });
    }

    isRightDiff(guessResult: GuessResult): void {
        if (guessResult.correct && !guessResult.alreadyFound) {
            this.playAudio('success');
            this.sendDiffFound();
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
            this.playAudio('manyErrors');
            this.errorCounter = 0;
        } else {
            this.playAudio('error');
        }
    }

    playAudio(soundId: string): void {
        this.audioPlayer.pause();
        switch (soundId) {
            case 'success':
                this.audioPlayer.src = 'assets/sounds/Success sound.mp3';
                break;
            case 'error':
                this.audioPlayer.src = 'assets/sounds/Windows XP Error Sound.mp3';
                break;
            case 'manyErrors':
                this.audioPlayer.src = 'assets/sounds/Come on man Joe Biden.mp3';
                break;
            default:
                this.audioPlayer.src = '';
                break;
        }
        this.audioPlayer.load();
        this.audioPlayer.play();
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
}
