import { BIT_PER_PIXEL, BLINK_COUNT, BLINK_PERIOD_MS, CANVAS, RGB_RED } from '@app/constants/utils-constants';
import { Coordinate } from '@common/coordinate';

export class ImageOperationService {
    // attributs pour sauvegarder les ids des intervalles et en supporter plusieurs en même temps
    intervalIds: number[] = [];
    newestTimerId: number = 0;
    oldestTimerId: number = 0;

    private originalImgContext: CanvasRenderingContext2D;
    private modifiedImgContext: CanvasRenderingContext2D;

    // attribut pour sauvegarder l'image originale
    private originalImageSave: ImageData;
    private isFirstBlink = true;

    get contextOriginal(): CanvasRenderingContext2D {
        return this.originalImgContext;
    }

    get contextModified(): CanvasRenderingContext2D {
        return this.modifiedImgContext;
    }

    setCanvasContext(original: CanvasRenderingContext2D, modified: CanvasRenderingContext2D): void {
        this.originalImgContext = original;
        this.modifiedImgContext = modified;
    }

    saveOriginalImageData(): void {
        const image = this.originalImgContext.getImageData(0, 0, CANVAS.width, CANVAS.height);
        this.originalImageSave = structuredClone(image);
    }

    /**
     * Initalise le clignotement des différences
     *
     * @param differences Liste des pixels a faire clignoter
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
     * Crée l'intervalle de clignotement
     *
     * @param differences liste des pixels a faire clignoter
     * @returns Promese resolved quand l'intervalle est terminé
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
     * Fait clignoter les pixels differents entre les deux images
     *
     * @param differences Liste des pixels a faire clignoter
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
     * Met les pixels de l'image originale dans les deux canvas
     *
     * @param differences liste des pixels a modifier
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
