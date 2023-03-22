/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { fakeAsync, TestBed } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { InGameService } from '@app/services/in-game.service';
import { Coordinate } from '@common/coordinate';
import { ImageOperationService } from './image-operation.service';

describe('ImageOperationService', () => {
    let service: ImageOperationService;
    let canvasOriginal: CanvasRenderingContext2D;
    let canvasModified: CanvasRenderingContext2D;
    let inGameServiceSpy: jasmine.SpyObj<InGameService>;

    const differences: Coordinate[] = [];
    const CANVAS_WIDTH = 640;
    const CANVAS_HEIGHT = 480;

    beforeEach(async () => {
        inGameServiceSpy = jasmine.createSpyObj('InGameService', ['cheatGetAllDifferences']);

        TestBed.configureTestingModule({
            providers: [{ provide: InGameService, useValue: inGameServiceSpy }],
        });
        service = TestBed.inject(ImageOperationService);
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
        service['modifiedImageSave'] = canvasModified.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        service['originalImageSave'] = canvasOriginal.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
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
        spyOn(service, 'saveImageData').and.callFake(() => {});
        service.setCanvasContext(canvasOriginal, canvasModified);
        expect(service['originalImgContext']).toEqual(canvasOriginal);
        expect(service['modifiedImgContext']).toEqual(canvasModified);
        expect(service.saveImageData).toHaveBeenCalled();
    });

    it('saveImageData should save the original image data', () => {
        service.saveImageData();
        expect(service['originalImageSave']).toEqual(canvasOriginal.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT));
        expect(service['modifiedImageSave']).toEqual(canvasModified.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT));
    });

    it('pixelBlink should call createBlinkInterval and increment currentTimerId', async () => {
        spyOn(service, 'createBlinkInterval').and.returnValue(Promise.resolve());
        expect(service.newestTimerId).toEqual(0);
        service.pixelBlink(differences);
        expect(service.newestTimerId).toEqual(1);
        expect(service.createBlinkInterval).toHaveBeenCalled();
    });

    it('pixelBlink should not call createBlinkInterval and call cheatRemoveDiff if cheatInterval', async () => {
        spyOn(service, 'createBlinkInterval').and.returnValue(Promise.resolve());
        spyOn(service, 'cheatRemoveDiff' as any).and.returnValue(Promise.resolve());
        service['cheatInterval'] = 1;
        service.pixelBlink(differences);
        expect(service.createBlinkInterval).not.toHaveBeenCalled();
        expect(service['cheatRemoveDiff']).toHaveBeenCalled();
    });

    it('createBlinkInterval should call highlightPixels and originalPixel', fakeAsync(async () => {
        const originalPixelSpy = spyOn(service, 'setOriginalPixel').and.callFake(() => {});
        const highlightPixelsSpy = spyOn(service, 'highlightPixels').and.callFake(() => {});
        service['originalImageSave'] = canvasOriginal.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        service.createBlinkInterval(differences).then(() => {
            expect(service.intervalIds[service.oldestTimerId]).toBeDefined();
            expect(originalPixelSpy.calls.count()).toEqual(4);
            expect(highlightPixelsSpy.calls.count()).toEqual(4);
        });

        for (let j = 0; j <= 6; j++) {
            jasmine.clock().tick(250);
        }

        clearInterval(service.intervalIds[service.oldestTimerId]);
    }));

    it('highlightPixels should call putImageData and getImageData', () => {
        const putImageDataSpy = spyOn(canvasModified, 'putImageData').and.stub();
        service.highlightPixels(differences);
        expect(putImageDataSpy).toHaveBeenCalledTimes(differences.length);
    });

    it('setOriginalPixel should call set on modifiedImageSave.data', () => {
        const setSpy = spyOn(service['modifiedImageSave'].data, 'set').and.callFake(() => {});
        service.setOriginalPixel(differences);
        expect(setSpy).toHaveBeenCalledTimes(differences.length);
    });

    it('setOriginalPixel should call putImageData and getImageData', () => {
        const putImageDataSpy = spyOn(CanvasRenderingContext2D.prototype, 'putImageData').and.callFake(() => {});
        service.setOriginalPixel(differences);
        expect(putImageDataSpy).toHaveBeenCalledTimes(2);
    });

    it('handleCheat should call disableCheat if interval is defined', () => {
        service['cheatInterval'] = 1;
        spyOn(service, 'disableCheat').and.callFake(() => {});
        service.handleCheat(1);
        expect(service.disableCheat).toHaveBeenCalled();
    });

    it('handleCheat should call cheatGetAllDifferences and set allDifferencesList', async () => {
        inGameServiceSpy.cheatGetAllDifferences.and.returnValue(Promise.resolve([[{ x: 1, y: 1 }], [{ x: 2, y: 2 }], [{ x: 3, y: 3 }]]));
        service['cheatInterval'] = 0;
        service.handleCheat(1);
        clearInterval(service['cheatInterval']);
        expect(inGameServiceSpy.cheatGetAllDifferences).toHaveBeenCalled();
    });

    it('handleCheat should call createImageDataCheat', async () => {
        inGameServiceSpy.cheatGetAllDifferences.and.returnValue(Promise.resolve([[{ x: 1, y: 1 }], [{ x: 2, y: 2 }], [{ x: 3, y: 3 }]]));
        spyOn(service, 'createImageDataCheat' as any);
        service['cheatInterval'] = 0;
        await service.handleCheat(1);
        clearInterval(service['cheatInterval']);
        expect(service['createImageDataCheat']).toHaveBeenCalled();
    });

    it('handleCheat should call putImageData times every 250ms', async () => {
        const putImageDataSpy = spyOn(CanvasRenderingContext2D.prototype, 'putImageData').and.callFake(() => {});
        service.cheatBlink();
        jasmine.clock().tick(500);
        expect(putImageDataSpy).toHaveBeenCalledTimes(6);
        jasmine.clock().tick(450);
        expect(putImageDataSpy).toHaveBeenCalledTimes(12);

        clearInterval(service['cheatInterval']);
    });

    it('handleCheat should do nothing if isFocused is true', async () => {
        service.isChatFocused = true;
        spyOn(service, 'createImageDataCheat' as any);
        spyOn(service, 'disableCheat').and.callFake(() => {});
        service.handleCheat(1);
        expect(service.disableCheat).not.toHaveBeenCalled();
        expect(service['createImageDataCheat']).not.toHaveBeenCalled();
    });

    it('disableCheat set cheatInterval to 0', () => {
        service['cheatInterval'] = 1;
        service.disableCheat();
        expect(service['cheatInterval']).toEqual(0);
    });

    it('createImageDataCheat should call set on cheatImageData.data', () => {
        const setSpy = spyOn(Uint8ClampedArray.prototype, 'set').and.callFake(() => {});
        service['createImageDataCheat'](differences);
        expect(setSpy).toHaveBeenCalledTimes(differences.length);
    });

    it('cheatRemoveDiff should call updateBaseImagesSave and createImageDataCheat and set to [] the list at the index that correspond', () => {
        spyOn(service, 'updateBaseImagesSave' as any).and.callFake(() => {});
        spyOn(service, 'createImageDataCheat' as any).and.callFake(() => {});
        service['allDifferencesList'] = [
            [
                { x: 1, y: 1 },
                { x: 1, y: 1 },
            ],
            [{ x: 2, y: 2 }],
        ];

        expect(service['allDifferencesList'].length).toEqual(2);
        service['cheatRemoveDiff']([{ x: 2, y: 2 }]);
        expect(service['allDifferencesList'][1]).toEqual([]);
        expect(service['updateBaseImagesSave']).toHaveBeenCalled();
        expect(service['createImageDataCheat']).toHaveBeenCalled();
    });

    it('updateBaseImagesSave should call slice on originalImageSave.data and set on modifiedImageSave.data. for all differences', () => {
        const sliceSpy = spyOn(Uint8ClampedArray.prototype, 'slice').and.returnValue(new Uint8ClampedArray());
        const setSpy = spyOn(Uint8ClampedArray.prototype, 'set').and.callFake(() => {});
        service['updateBaseImagesSave'](differences);
        expect(sliceSpy).toHaveBeenCalledTimes(differences.length);
        expect(setSpy).toHaveBeenCalledTimes(differences.length);
    });

    it('isSameDifference should return true if the list are the same', () => {
        const list1 = [{ x: 1, y: 1 }];
        const list2 = [{ x: 1, y: 1 }];
        expect(service['isSameDifference'](list1, list2)).toEqual(true);
    });

    it('isSameDifference should return false if the list are not the same', () => {
        const list1 = [{ x: 1, y: 1 }];
        const list2 = [{ x: 2, y: 2 }];
        expect(service['isSameDifference'](list1, list2)).toEqual(false);
    });
});
