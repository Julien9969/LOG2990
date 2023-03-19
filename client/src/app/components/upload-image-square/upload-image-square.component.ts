import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@app/constants/utils-constants';
import { DrawService } from '@app/services/draw.service';
import ValidateImageService from '@app/services/validate-image.service';
import { Coordinate } from '@common/coordinate';

@Component({
    selector: 'app-upload-image-square',
    templateUrl: './upload-image-square.component.html',
    styleUrls: ['./upload-image-square.component.scss'],
})
export class UploadImageSquareComponent implements AfterViewInit {
    @ViewChild('imageInput') imageInput: ElementRef<HTMLInputElement>;
    @ViewChild('drawCanvas', { static: false }) drawCanvas!: ElementRef<HTMLCanvasElement>;
    @Input() title: string;

    @Output() mouseDown: EventEmitter<Coordinate> = new EventEmitter<Coordinate>();
    @Output() mouseMove: EventEmitter<Coordinate> = new EventEmitter<Coordinate>();
    @Output() invalidImageType: EventEmitter<void> = new EventEmitter<void>();
    @Output() clearForeground: EventEmitter<void> = new EventEmitter<void>();
    @Output() replaceForeground: EventEmitter<void> = new EventEmitter<void>();
    component: HTMLInputElement;

    foregroundCanvas: HTMLCanvasElement;
    emptyBackground: HTMLCanvasElement;

    bgImage: HTMLImageElement;

    constructor(readonly drawService: DrawService, readonly validateImageService: ValidateImageService) {
        this.initEmptyBackground();
        this.bgImage = new Image(IMAGE_WIDTH, IMAGE_HEIGHT);
        this.bgImage.src = this.emptyBackground.toDataURL();

        this.foregroundCanvas = document.createElement('canvas');
        this.foregroundCanvas.height = IMAGE_HEIGHT;
        this.foregroundCanvas.width = IMAGE_WIDTH;
    }

    get canvas(): HTMLCanvasElement {
        return this.drawCanvas.nativeElement;
    }

    get canvasContext(): CanvasRenderingContext2D {
        return this.drawCanvas.nativeElement.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
    }

    get fgContext(): CanvasRenderingContext2D {
        return this.foregroundCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
    }

    ngAfterViewInit(): void {
        this.canvasContext.fillStyle = 'white';
        this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    initEmptyBackground() {
        this.emptyBackground = document.createElement('canvas');
        this.emptyBackground.height = IMAGE_HEIGHT;
        this.emptyBackground.width = IMAGE_WIDTH;
        (this.emptyBackground.getContext('2d') as CanvasRenderingContext2D).fillStyle = 'white';
        (this.emptyBackground.getContext('2d') as CanvasRenderingContext2D).fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    }

    async getImageFile() {
        const imageToBlob = new Promise<Blob>((resolve, reject) => {
            this.canvas.toBlob(
                (blob) => {
                    if (blob !== null) resolve(blob);
                    else reject('Original canvas returned null.');
                },
                'image/png',
                1,
            );
        });
        return new File([await imageToBlob], 'image.png');
    }

    clearBackground() {
        this.imageInput.nativeElement.value = '';
        this.bgImage.src = this.emptyBackground.toDataURL();
        this.canvasContext.clearRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        this.drawForeground();
    }

    async loadBackground(imgInput: HTMLInputElement): Promise<void> {
        if (!(await this.validateImageService.validateImage(imgInput))) {
            this.invalidImageType.emit();
            return;
        }

        const obj = URL.createObjectURL((imgInput.files as FileList)[0]);
        this.bgImage.src = obj;
        this.bgImage.onload = () => {
            this.updateCanvas();
        };
    }

    updateCanvas() {
        this.canvasContext.drawImage(this.bgImage, 0, 0);
        this.drawForeground();
    }

    drawForeground() {
        const fgImage = new Image();
        fgImage.src = this.foregroundCanvas.toDataURL();
        fgImage.onload = () => {
            this.canvasContext.drawImage(fgImage, 0, 0);
        };
    }

    onMouseDown(event: MouseEvent) {
        this.mouseDown.emit(this.eventToImageCoordinate(event));
    }

    onMouseMove(event: MouseEvent) {
        this.mouseMove.emit(this.eventToImageCoordinate(event));
    }

    eventToImageCoordinate(event: MouseEvent): Coordinate {
        return {
            x: this.clamp(event.offsetX, 0, IMAGE_WIDTH - 1),
            y: this.clamp(event.offsetY, 0, IMAGE_HEIGHT - 1),
        };
    }

    clamp(base: number, minimum: number, maximum: number) {
        return Math.max(minimum, Math.min(base, maximum));
    }
}
