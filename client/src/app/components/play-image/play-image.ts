import { ElementRef, EventEmitter } from '@angular/core';
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
}
