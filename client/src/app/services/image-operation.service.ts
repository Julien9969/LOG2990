import { BIT_PER_PIXEL, BLINK_COUNT, BLINK_PERIOD_MS, CANVAS, RGB_RED } from '@app/constants/utils-constants';
import { Coordinate } from '@common/coordinate';

export class ImageOperationService {
    originalImgContext: CanvasRenderingContext2D;
    modifiedImgContext: CanvasRenderingContext2D;

    // attribute to save the interval ids and handle multiple intervals
    intervalIds: number[] = [];
    newestTimerId: number = 0;
    oldestTimerId: number = 0;

    // attribute to save the original image data
    originalImageSave: ImageData;
    isFirstBlink: boolean = true;

    get contextOriginal(): CanvasRenderingContext2D {
        return this.originalImgContext;
    }

    get contextModified(): CanvasRenderingContext2D {
        return this.modifiedImgContext;
    }

    saveOriginalImageData(): void {
        const image = this.originalImgContext.getImageData(0, 0, CANVAS.width, CANVAS.height);
        this.originalImageSave = structuredClone(image);
    }

    /**
     * Initialize the blink of the pixels that are different between the original and the modified image
     *
     * @param differences list of coordinates of the pixels to highlight
     */
    pixelBlink(differences: Coordinate[]): void {
        if (this.isFirstBlink) {
            this.saveOriginalImageData();
            this.isFirstBlink = false;
        }

        this.createBlinkInterval(differences).finally(() => {
            clearInterval(this.intervalIds[this.oldestTimerId]);
            this.oldestTimerId++;
        });
        this.newestTimerId++;
    }

    /**
     * Create the blink interval
     *
     * @param differences list of coordinates of the pixels to highlight
     * @returns promise that resolves when the blink is done
     */
    async createBlinkInterval(differences: Coordinate[]): Promise<void> {
        let count = 0;
        return new Promise<void>((done) => {
            this.intervalIds[this.newestTimerId] = window.setInterval(() => {
                if (count % 2 === 0) {
                    this.highlightPixels(differences);
                } else {
                    this.setOriginalPixel(differences);
                }
                if (count === BLINK_COUNT) {
                    this.setOriginalPixel(differences);
                    return done();
                }
                count++;
            }, BLINK_PERIOD_MS);
        });
    }

    /**
     * Highlight the pixels that are different between the original and the modified image
     *
     * @param differences list of coordinates of the pixels to highlight
     */
    highlightPixels(differences: Coordinate[]): void {
        differences.forEach((difference) => {
            const highlightedPixel = new Uint8ClampedArray(BIT_PER_PIXEL);
            highlightedPixel[0] = RGB_RED.r;
            highlightedPixel[1] = RGB_RED.g;
            highlightedPixel[2] = RGB_RED.b;
            highlightedPixel[3] = RGB_RED.a;

            this.originalImgContext.putImageData(new ImageData(highlightedPixel, 1, 1), difference.x, difference.y);
            this.modifiedImgContext.putImageData(new ImageData(highlightedPixel, 1, 1), difference.x, difference.y);
        });
    }

    /**
     * set the original pixel in the modified image and the original image
     *
     * @param differences list of coordinates of the pixels to highlight
     */
    setOriginalPixel(differences: Coordinate[]): void {
        differences.forEach((difference) => {
            const pixelIndex = (difference.y * CANVAS.width + difference.x) * BIT_PER_PIXEL;
            const originalPixel = this.originalImageSave.data.slice(pixelIndex, pixelIndex + BIT_PER_PIXEL);
            this.modifiedImgContext.putImageData(new ImageData(originalPixel, 1, 1), difference.x, difference.y);
            this.originalImgContext.putImageData(new ImageData(originalPixel, 1, 1), difference.x, difference.y);
        });
    }
}
