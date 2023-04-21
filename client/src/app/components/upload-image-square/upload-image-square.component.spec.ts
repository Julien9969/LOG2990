/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { PATH_TO_VALID_IMAGE } from '@app/constants/utils-constants';
import { UploadImageSquareComponent } from './upload-image-square.component';

describe('UploadImageSquareComponent', () => {
    let component: UploadImageSquareComponent;
    let fixture: ComponentFixture<UploadImageSquareComponent>;
    let validInput: HTMLInputElement;
    let emptyInput: HTMLInputElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [UploadImageSquareComponent],
            imports: [MatIconModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(UploadImageSquareComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    beforeEach(async () => {
        validInput = document.createElement('input');
        validInput.type = 'file';
        const validFile = new File([await (await fetch(PATH_TO_VALID_IMAGE)).blob()], 'valid-image.BMP', { type: 'image/bmp' });
        const dataTransfer = new DataTransfer();

        dataTransfer.items.add(validFile);
        validInput.files = dataTransfer.files;

        emptyInput = document.createElement('input');
        emptyInput.type = 'file';
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    describe('getImageFile', () => {
        it('converts canvas to blob with correct parameters', async () => {
            const imageDataSpy = spyOn(component.canvasContext, 'getImageData').and.callFake(() => {
                return new ImageData(1, 1);
            });
            const receivedFile = await component.getImageFile();

            expect(receivedFile).toEqual(new File([await receivedFile], 'image.bmp'));
            expect(imageDataSpy).toHaveBeenCalled();
        });

        it('throws error when canvas getImageData fails', async () => {
            spyOn(component.canvasContext, 'getImageData').and.callFake(() => {
                throw new Error();
            });

            await expect(() => component.getImageFile()).toThrow();
        });
    });

    describe('clearBackground', () => {
        it('sets background image to empty and redraws foreground', () => {
            const dataUrlSpy = spyOn(component.emptyBackground, 'toDataURL').and.callFake(() => '');
            const clearRectSpy = spyOn(component.canvasContext, 'clearRect').and.callFake(() => {});
            const drawForegroundSpy = spyOn(component, 'drawForeground').and.callFake(() => {});

            component.clearBackground();
            expect(dataUrlSpy).toHaveBeenCalled();
            expect(clearRectSpy).toHaveBeenCalled();
            expect(drawForegroundSpy).toHaveBeenCalled();
        });
    });

    describe('loadBackground', () => {
        it('should create url and update canvas when image valid', async () => {
            const createObjectURLSpy = spyOn(URL, 'createObjectURL');
            const validateImageSpy = spyOn(component.validateImageService, 'validateImage').and.callFake(
                async () => new Promise((resolve) => resolve(true)),
            );
            const updateCanvas = spyOn(component, 'updateCanvas').and.callFake(() => {});

            await component.loadBackground(validInput);
            (component.backgroundImage.onload as () => void)();

            expect(validateImageSpy).toHaveBeenCalled();
            expect(createObjectURLSpy).toHaveBeenCalledOnceWith((validInput.files as FileList)[0]);
            expect(updateCanvas).toHaveBeenCalled();
        });

        it('should emit invalidImageType event when image invalid', async () => {
            const createObjectURLSpy = spyOn(URL, 'createObjectURL');
            const validateImageSpy = spyOn(component.validateImageService, 'validateImage').and.callFake(
                async () => new Promise((resolve) => resolve(false)),
            );
            const invalidImageTypeSpy = spyOn(component.invalidImageType, 'emit').and.callFake(() => {});

            await component.loadBackground(emptyInput);
            expect(validateImageSpy).toHaveBeenCalled();
            expect(createObjectURLSpy).not.toHaveBeenCalled();
            expect(invalidImageTypeSpy).toHaveBeenCalled();
        });
    });

    describe('updateCanvas', () => {
        it('draws background then foreground', () => {
            const canvasDrawImageSpy = spyOn(component.canvasContext, 'drawImage').and.callFake(() => {});
            const drawForegroundSpy = spyOn(component, 'drawForeground').and.callFake(() => {});

            component.updateCanvas();

            expect(canvasDrawImageSpy).toHaveBeenCalled();
            expect(drawForegroundSpy).toHaveBeenCalled();
        });
    });

    describe('drawForeground', () => {
        it('draws background then foreground', async () => {
            const toDataURLSpy = spyOn(component['foregroundCanvas'], 'toDataURL').and.callFake(() =>
                URL.createObjectURL((validInput.files as FileList)[0]),
            );
            let canvasDrawImageSpy;

            await new Promise<void>((resolve) => {
                component.drawForeground();
                canvasDrawImageSpy = spyOn(component.canvasContext, 'drawImage').and.callFake(() => {
                    resolve();
                });
            });

            expect(toDataURLSpy).toHaveBeenCalled();
            expect(canvasDrawImageSpy).toHaveBeenCalled();
        });
    });

    describe('mouse movements', () => {
        it('onMouseDown emits mouseDown event with image coordinates', () => {
            const stubCoords = { x: 1, y: 1 };
            const mouseDownEmitSpy = spyOn(component.mouseDown, 'emit').and.callFake(() => {});
            const eventToImageCoordinateSpy = spyOn(component, 'eventToImageCoordinate' as any).and.callFake(() => stubCoords);

            component.onMouseDown(new MouseEvent('mousedown'));

            expect(eventToImageCoordinateSpy).toHaveBeenCalled();
            expect(mouseDownEmitSpy).toHaveBeenCalledWith(stubCoords);
        });

        it('onMouseMove emits mouseMove event with image coordinates', () => {
            const stubCoords = { x: 1, y: 1 };
            const mouseMoveEmitSpy = spyOn(component.mouseMove, 'emit').and.callFake(() => {});
            const eventToImageCoordinateSpy = spyOn(component, 'eventToImageCoordinate' as any).and.callFake(() => stubCoords);

            component.onMouseMove(new MouseEvent('mousemove'));

            expect(eventToImageCoordinateSpy).toHaveBeenCalled();
            expect(mouseMoveEmitSpy).toHaveBeenCalledWith(stubCoords);
        });
    });

    describe('eventToImageCoordinate', () => {
        it('clamps x and y', () => {
            const clampSpy = spyOn(component, 'clamp' as any).and.callFake(() => 0);
            const result = component['eventToImageCoordinate'](new MouseEvent(''));

            expect(clampSpy).toHaveBeenCalledTimes(2);
            expect(result).toEqual({ x: 0, y: 0 });
        });
    });

    describe('canvas context getters', () => {
        it('fgContext gets 2d context of foregroundCanvas', () => {
            const getContextSpy = spyOn(component['foregroundCanvas'], 'getContext').and.callFake(() => null);

            const result = component.foregroundContext;
            expect(result).toBeFalsy();
            expect(getContextSpy).toHaveBeenCalledWith('2d', { willReadFrequently: true });
        });
    });

    describe('clamp', () => {
        it('returns value when in range', () => {
            const input = 5;
            const min = 0;
            const max = 10;
            expect(component['clamp'](input, min, max)).toEqual(input);
        });

        it('returns min when value smaller', () => {
            const input = -8;
            const min = 0;
            const max = 10;
            expect(component['clamp'](input, min, max)).toEqual(min);
        });

        it('returns max wgen value larger', () => {
            const input = 18;
            const min = 0;
            const max = 10;
            expect(component['clamp'](input, min, max)).toEqual(max);
        });
    });
});
