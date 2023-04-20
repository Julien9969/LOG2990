/* eslint-disable max-lines */ // Les modifications ajoutées sont nécessaires
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
// import { BIT_PER_PIXEL, BLINK_COUNT, BLINK_PERIOD_MS, CANVAS, CHEAT_PERIOD_MS, RGB_GREEN, RGB_RED } from '@app/constants/utils-constants';
import {
    BIT_PER_PIXEL,
    BLINK_COUNT,
    BLINK_PERIOD_MS,
    CANVAS,
    CHEAT_PERIOD_MS,
    IMAGE_HEIGHT,
    IMAGE_WIDTH,
    RGB_GREEN,
    RGB_RED,
} from '@app/constants/utils-constants';
import { RATIO_POINTER_IMAGE as POINTER_TO_CANVAS_RATIO, POINTER_X_OFFSET } from '@app/services/constantes.service';
import { GameActionLoggingService } from '@app/services/game-action-logging/game-action-logging.service';
import { InGameService } from '@app/services/in-game/in-game.service';
import { Coordinate } from '@common/coordinate';

@Injectable({
    providedIn: 'root',
})
export class ImageOperationService {
    // attributs pour sauvegarder les ids des intervalles et en supporter plusieurs en même temps
    intervalIds: number[] = [];
    newestTimerId: number = 0;
    oldestTimerId: number = 0;

    isChatFocused: boolean = false;
    cheatInterval: number;

    private originalImgContext: CanvasRenderingContext2D;
    private modifiedImgContext: CanvasRenderingContext2D;

    // attribut pour sauvegarder les images initiales
    private originalImageSave: ImageData;
    private modifiedImageSave: ImageData;

    private cheatImagesData: ImageData;
    private allDifferencesList: Coordinate[][];

    private clueOriginalImageData: ImageData;
    private clueModifiedImageData: ImageData;

    constructor(private readonly inGameService: InGameService, private replayService: GameActionLoggingService) {}

    reset() {
        this.intervalIds.forEach((interval) => {
            clearInterval(interval);
        });
        this.intervalIds = [];
        this.allDifferencesList = undefined as any;
        clearInterval(this.cheatInterval);
        this.cheatInterval = 0;
        this.cheatImagesData = undefined as any;
        this.newestTimerId = 0;
        this.oldestTimerId = 0;
    }

    getSpeedMultiplier() {
        if (this.replayService.isRecording) {
            return 1;
        }
        return 1 / this.replayService.speedMultiplier;
    }
    setCanvasContext(original: CanvasRenderingContext2D, modified: CanvasRenderingContext2D): void {
        this.originalImgContext = original;
        this.modifiedImgContext = modified;
        this.saveImageData();
    }

    saveImageData(): void {
        const imageOriginal = this.originalImgContext.getImageData(0, 0, CANVAS.width, CANVAS.height);
        this.originalImageSave = structuredClone(imageOriginal);
        const imageModified = this.modifiedImgContext.getImageData(0, 0, CANVAS.width, CANVAS.height);
        this.modifiedImageSave = structuredClone(imageModified);
    }

    /**
     * Initalise le clignotement des différences
     *
     * @param differences Liste des pixels a faire clignoter
     */
    async pixelBlink(differences: Coordinate[]): Promise<void> {
        if (this.cheatInterval) {
            await this.cheatRemoveDiff(differences);
            return;
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
        this.removeClue();
        return new Promise<void>((done) => {
            this.intervalIds[this.newestTimerId] = window.setInterval(() => {
                if (count % 2 === 0) {
                    this.highlightPixels(differences);
                } else {
                    this.setOriginalPixel(differences);
                }
                if (count === BLINK_COUNT) {
                    this.setOriginalPixel(differences);
                    this.showClue();
                    return done();
                }
                count++;
            }, BLINK_PERIOD_MS * this.getSpeedMultiplier());
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
            this.modifiedImageSave.data.set(originalPixel, pixelIndex);
        });
        this.originalImgContext.putImageData(this.originalImageSave, 0, 0);
        this.modifiedImgContext.putImageData(this.modifiedImageSave, 0, 0);
    }

    /**
     * Met en place l'interval de clignotement de triche
     *
     * @param sessionId id de la session
     * @returns l'interval de clignotement de triche
     */
    async handleCheat(sessionId: number): Promise<void> {
        if (this.isChatFocused) {
            return;
        }
        if (this.cheatInterval) {
            this.disableCheat();
            this.replayService.logAction('CHEATLOGGER', { isStarting: false, pixelList: [], diffList: [] });
        } else {
            this.allDifferencesList = await this.inGameService.cheatGetAllDifferences(sessionId);

            const differencesInOneList: Coordinate[] = [];
            this.allDifferencesList.forEach((differences) => {
                differencesInOneList.push(...differences);
            });

            this.replayService.logAction('CHEATLOGGER', {
                isStarting: true,
                pixelList: differencesInOneList,
                diffList: [...this.allDifferencesList],
            });
            await this.createImageDataCheat(differencesInOneList);

            await this.cheatBlink();
        }
    }
    async handleCheatReplay(isStarting: boolean, pixelList: Coordinate[], diffList: Coordinate[][]): Promise<void> {
        if (!isStarting) {
            this.disableCheat();
        } else {
            this.allDifferencesList = diffList;
            await this.createImageDataCheat(pixelList);
            await this.cheatBlink();
        }
    }

    /**
     * Met en place l'affichage de l'indice
     */
    async handleClue(nbCluesLeft: number, differences: Coordinate[]) {
        if (this.isChatFocused) return;
        await this.createImagesDataClue(nbCluesLeft, differences);
        this.showClue();
    }

    /**
     * Créer l'interval de clignotement pour la triche
     */
    async cheatBlink(): Promise<void> {
        this.cheatInterval = window.setInterval(() => {
            this.originalImgContext.putImageData(this.cheatImagesData, 0, 0);
            this.modifiedImgContext.putImageData(this.cheatImagesData, 0, 0);

            setTimeout(() => {
                this.originalImgContext.putImageData(this.originalImageSave, 0, 0);
                this.modifiedImgContext.putImageData(this.modifiedImageSave, 0, 0);
            }, CHEAT_PERIOD_MS * this.getSpeedMultiplier());
        }, CHEAT_PERIOD_MS * 2 * this.getSpeedMultiplier());
    }
    clearAllIntervals() {
        clearInterval(this.cheatInterval);
        this.cheatInterval = 0;
        this.intervalIds.forEach((interval) => {
            clearInterval(interval);
        });
        this.intervalIds = [];
    }
    disableCheat(): void {
        clearInterval(this.cheatInterval);
        this.cheatInterval = 0;
    }

    /**
     * Crée l'image de triche avec les pixels de différence non trouvé en vert
     *
     * @param differences liste des pixels a mettre en vert
     */
    async createImageDataCheat(differences: Coordinate[]): Promise<void> {
        const cheatImageData = structuredClone(this.originalImageSave);

        differences.forEach((difference) => {
            const pixelIndex = (difference.y * CANVAS.width + difference.x) * BIT_PER_PIXEL;
            const highlightedPixel = new Uint8ClampedArray(BIT_PER_PIXEL);
            highlightedPixel[0] = RGB_GREEN.r;
            highlightedPixel[1] = RGB_GREEN.g;
            highlightedPixel[2] = RGB_GREEN.b;
            highlightedPixel[3] = RGB_GREEN.a;

            cheatImageData.data.set(highlightedPixel, pixelIndex);
        });

        this.cheatImagesData = cheatImageData;
    }

    private showClue() {
        this.originalImgContext.putImageData(this.clueOriginalImageData, 0, 0);
        this.modifiedImgContext.putImageData(this.clueModifiedImageData, 0, 0);
    }

    private removeClue() {
        this.originalImgContext.putImageData(this.originalImageSave, 0, 0);
        this.modifiedImgContext.putImageData(this.modifiedImageSave, 0, 0);
        this.clueOriginalImageData = this.originalImageSave;
        this.clueModifiedImageData = this.modifiedImageSave;
    }

    /**
     * Crée l'image d'indice avec les pixels d'incides en rouge ou l'indice spéciale
     *
     * @param differences liste des pixels a mettre en rouge
     */
    private async createImagesDataClue(nbCluesLeft: number, differences: Coordinate[] = []): Promise<void> {
        if (!nbCluesLeft) {
            return await this.createlastClueImageData(differences[0]);
        }

        const clueOriginalImageData = structuredClone(this.originalImageSave);
        const clueModifiedImageData = structuredClone(this.modifiedImageSave);

        differences.forEach((difference) => {
            const outsideXInterval = difference.x < 0 || difference.x >= IMAGE_WIDTH;
            const outsideYInterval = difference.y < 0 || difference.y >= IMAGE_HEIGHT;
            if (outsideXInterval || outsideYInterval) return;
            const pixelIndex = (difference.y * CANVAS.width + difference.x) * BIT_PER_PIXEL;
            const highlightedPixel = new Uint8ClampedArray(BIT_PER_PIXEL);
            highlightedPixel[0] = RGB_RED.r;
            highlightedPixel[1] = RGB_RED.g;
            highlightedPixel[2] = RGB_RED.b;
            highlightedPixel[3] = RGB_RED.a;

            clueOriginalImageData.data.set(highlightedPixel, pixelIndex);
            clueModifiedImageData.data.set(highlightedPixel, pixelIndex);
        });

        this.clueOriginalImageData = clueOriginalImageData;
        this.clueModifiedImageData = clueModifiedImageData;
    }

    private async createlastClueImageData(difference: Coordinate) {
        const contextOriginalImg = this.createBlankCanvas();
        const contextModifiedImg = this.createBlankCanvas();

        contextOriginalImg.putImageData(this.originalImageSave, 0, 0);
        contextModifiedImg.putImageData(this.modifiedImageSave, 0, 0);

        const isPointerFlipped = difference.x < IMAGE_WIDTH / 2;

        const pointer: HTMLImageElement = new Image();
        const extension = isPointerFlipped ? 'Left.png' : 'Right.png';
        pointer.src = 'assets/logo/AmongPointing' + extension;

        // pour attendre que l'image soit téléversé correctement
        await new Promise<void>((resolve) => {
            pointer.onload = () => {
                resolve();
            };
        });

        const pointerHeight = Math.floor(IMAGE_HEIGHT * POINTER_TO_CANVAS_RATIO);
        const pointerWidth = Math.floor(IMAGE_WIDTH * POINTER_TO_CANVAS_RATIO);

        contextOriginalImg.drawImage(
            pointer,
            isPointerFlipped ? difference.x + POINTER_X_OFFSET : difference.x - pointerWidth - POINTER_X_OFFSET,
            difference.y - pointerHeight * POINTER_TO_CANVAS_RATIO,
            pointerWidth,
            pointerHeight,
        );
        contextModifiedImg.drawImage(
            pointer,
            isPointerFlipped ? difference.x + POINTER_X_OFFSET : difference.x - pointerWidth - POINTER_X_OFFSET,
            difference.y - pointerHeight * POINTER_TO_CANVAS_RATIO,
            pointerWidth,
            pointerHeight,
        );

        this.clueOriginalImageData = contextOriginalImg.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
        this.clueModifiedImageData = contextModifiedImg.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    }

    private createBlankCanvas(): CanvasRenderingContext2D {
        const canvasForOriginalImg = document.createElement('canvas');
        canvasForOriginalImg.width = IMAGE_WIDTH;
        canvasForOriginalImg.height = IMAGE_HEIGHT;

        return canvasForOriginalImg.getContext('2d') as CanvasRenderingContext2D;
    }

    /**
     * Enlève la difference de la liste des diférences et met a jour les images de base et de triche
     *
     * @param diffToRemove liste des pixels a enlever de la liste de triche
     */
    private async cheatRemoveDiff(diffToRemove: Coordinate[]): Promise<void> {
        const differencesInOneList: Coordinate[] = [];
        this.allDifferencesList.forEach((differenceList, index) => {
            if (this.isSameDifference(differenceList, diffToRemove)) {
                this.allDifferencesList[index] = [];
            } else {
                differencesInOneList.push(...differenceList);
            }
        });

        this.updateBaseImagesSave(diffToRemove);
        this.createImageDataCheat(differencesInOneList);
    }
    /**
     * met les pixels de l'image de original dans l'image de modifier
     *
     * @param difference liste des pixels a mettre a jour dans l'image modifiée de base
     */
    private updateBaseImagesSave(difference: Coordinate[]): void {
        difference.forEach((diff) => {
            const pixelIndex = (diff.y * CANVAS.width + diff.x) * BIT_PER_PIXEL;
            const originalPixel = this.originalImageSave.data.slice(pixelIndex, pixelIndex + BIT_PER_PIXEL);
            this.modifiedImageSave.data.set(originalPixel, pixelIndex);
        });
    }
    private isSameDifference(differenceList: Coordinate[], diffToRemove: Coordinate[]): boolean {
        return differenceList.length !== 0 && differenceList[0].x === diffToRemove[0].x && differenceList[0].y === diffToRemove[0].y;
    }
}
