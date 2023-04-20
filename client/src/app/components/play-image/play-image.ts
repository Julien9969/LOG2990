import { ElementRef, EventEmitter } from '@angular/core';
import { ERROR_TIMEOUT } from '@app/constants/utils-constants';
import { AudioService } from '@app/services/audio/audio.service';
import { CommunicationService } from '@app/services/communication/communication.service';
import { ImageOperationService } from '@app/services/image-operation/image-operation.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { MouseService } from '@app/services/mouse/mouse.service';
import { Coordinate } from '@common/coordinate';

export class PlayImage {
    sessionID!: number;
    imageMainId!: number;
    imageAltId!: number;

    diffFoundUpdate: EventEmitter<[string, number][]> = new EventEmitter<[string, number][]>();
    imageCanvas1!: ElementRef<HTMLCanvasElement>;
    imageCanvas2!: ElementRef<HTMLCanvasElement>;
    errorMsgPosition: Coordinate;
    errorCounter: number = 0;
    errorGuess: boolean = false;

    // eslint-disable-next-line max-params -- necéssaire pour le fonctionnement
    constructor(
        protected readonly mouseService: MouseService,
        protected readonly communicationService: CommunicationService,
        protected readonly audioService: AudioService,
        protected readonly imageOperationService: ImageOperationService,
        protected readonly socket: InGameService,
    ) {}

    get canvasContext1(): CanvasRenderingContext2D {
        return this.imageCanvas1.nativeElement.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
    }

    get canvasContext2(): CanvasRenderingContext2D {
        return this.imageCanvas2.nativeElement.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
    }

    handleErrorGuess(coordinate: Coordinate): void {
        this.errorMsgPosition = coordinate;
        this.errorGuess = true;
        window.setTimeout(() => {
            this.errorGuess = false;
        }, ERROR_TIMEOUT);
        this.errorCounter++;

        if (this.errorCounter % 3 === 0) {
            this.audioService.playAudio('manyErrors');
            this.errorCounter = 0;
        } else {
            this.audioService.playAudio('error');
        }
    }

    drawImageOnCanvas(canvasContext: CanvasRenderingContext2D, img: HTMLImageElement): void {
        canvasContext.drawImage(img, 0, 0);
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

    async handleCheat() {
        await this.imageOperationService.handleCheat(this.sessionID);
    }

    async afterViewInit(): Promise<void> {
        await this.loadImage(this.canvasContext1, this.imageMainId);
        await this.loadImage(this.canvasContext2, this.imageAltId);
        this.imageOperationService.setCanvasContext(this.canvasContext1, this.canvasContext2);
    }

    onDestroy(): void {
        this.imageOperationService.disableCheat();
    }
}
