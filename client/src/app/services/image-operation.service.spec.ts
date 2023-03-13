/* eslint-disable @typescript-eslint/no-magic-numbers */
import { fakeAsync, TestBed } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { Coordinate } from '@common/coordinate';
import { ImageOperationService } from './image-operation.service';

describe('ImageOperationService', () => {
    let service: ImageOperationService;
    let canvasOriginal: CanvasRenderingContext2D;
    let canvasModified: CanvasRenderingContext2D;

    const differences: Coordinate[] = [];
    const CANVAS_WIDTH = 640;
    const CANVAS_HEIGHT = 480;

    beforeEach(async () => {
        TestBed.configureTestingModule({});
        service = new ImageOperationService();
        const img = new Image();
        img.src = 'assets/tests/image.bmp';
        canvasOriginal = CanvasTestHelper.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
        canvasModified = CanvasTestHelper.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
        canvasOriginal.drawImage(img, 0, 0);
        canvasModified.drawImage(img, 0, 0);
        service['originalImgContext'] = canvasOriginal;
        service['modifiedImgContext'] = canvasModified;
    });

    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        for (let x = 0; x < 10; x++) {
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            for (let y = 0; y < 10; y++) {
                differences.push({ x, y });
            }
        }
        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('get contextOriginal should return the original image context', () => {
        expect(service.contextOriginal).toEqual(canvasOriginal);
    });

    it('get contextModified should return the modified image context', () => {
        expect(service.contextModified).toEqual(canvasModified);
    });

    it('setCanvasToImageOperationService set canvas to imageOperationService', () => {
        service['originalImgContext'] = undefined as unknown as CanvasRenderingContext2D;
        service['modifiedImgContext'] = undefined as unknown as CanvasRenderingContext2D;
        service.setCanvasContext(canvasOriginal, canvasModified);
        expect(service['originalImgContext']).toEqual(canvasOriginal);
        expect(service['modifiedImgContext']).toEqual(canvasModified);
    });

    it('saveOriginalImageData should save the original image data', () => {
        service.saveOriginalImageData();
        expect(service['originalImageSave']).toEqual(canvasOriginal.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT));
    });

    it('pixelBlink should save the original image data if it is the first blink', () => {
        spyOn(service, 'saveOriginalImageData');
        service['isFirstBlink'] = true;
        service.pixelBlink(differences);
        expect(service.saveOriginalImageData).toHaveBeenCalled();
    });

    it('pixelBlink should not save the original image data if it is not the first blink', () => {
        spyOn(service, 'saveOriginalImageData');
        service['isFirstBlink'] = false;
        service.pixelBlink(differences);
        expect(service.saveOriginalImageData).not.toHaveBeenCalled();
    });

    it('pixelBlink should call blink and increment currentTimerId', async () => {
        spyOn(service, 'createBlinkInterval').and.returnValue(Promise.resolve());
        expect(service.newestTimerId).toEqual(0);
        service.pixelBlink(differences);
        expect(service.newestTimerId).toEqual(1);
        expect(service.createBlinkInterval).toHaveBeenCalledWith(differences);
    });

    it('createBlinkInterval should call highlightPixels and originalPixel', fakeAsync(async () => {
        const originalPixelSpy = spyOn(service, 'setOriginalPixel').and.callThrough();
        const highlightPixelsSpy = spyOn(service, 'highlightPixels').and.callThrough();
        service['originalImageSave'] = canvasOriginal.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        service.createBlinkInterval(differences).then(() => {
            expect(originalPixelSpy.calls.count()).toEqual(4);
            expect(highlightPixelsSpy.calls.count()).toEqual(4);
            expect(service.intervalIds[service.oldestTimerId]).toBeDefined();
        });

        for (let j = 0; j <= 6; j++) {
            jasmine.clock().tick(250);
        }

        expect(originalPixelSpy).toHaveBeenCalledWith(differences);
        expect(highlightPixelsSpy).toHaveBeenCalledWith(differences);
        clearInterval(service.intervalIds[service.oldestTimerId]);
    }));

    it('highlightPixels should call putImageData and getImageData', () => {
        const putImageDataSpy = spyOn(canvasModified, 'putImageData').and.stub();
        service.highlightPixels(differences);
        expect(putImageDataSpy).toHaveBeenCalledTimes(differences.length);
    });

    it('setOriginalPixel should call putImageData and getImageData', () => {
        service['originalImageSave'] = canvasOriginal.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const putImageDataSpy = spyOn(canvasModified, 'putImageData').and.stub();
        service.setOriginalPixel(differences);
        expect(putImageDataSpy).toHaveBeenCalledTimes(differences.length);
    });
});
