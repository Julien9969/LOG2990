/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestBed } from '@angular/core/testing';
import { PATH_TO_VALID_IMAGE, PATH_TO_WRONG_BIT_DEPTH_IMAGE, PATH_TO_WRONG_RES_IMAGE } from '@app/constants/utils-constants';
import ValidateImageService from './validate-image.service';

describe('validateImageService', () => {
    const URL = window.URL || window.webkitURL;
    let service: ValidateImageService;

    let wrongBitDepthFile: File;
    let wrongBitDepthImage: HTMLImageElement;

    let validFile: File;
    let validImage: HTMLImageElement;

    let wrongResFile: File;
    let wrongResImage: HTMLImageElement;

    let validateResSpy: jasmine.Spy;
    let validateBitDepthSpy: jasmine.Spy;
    let generateImageSpy: jasmine.Spy;

    beforeEach(() => TestBed.configureTestingModule({}));

    beforeEach(async () => {
        service = TestBed.inject(ValidateImageService);

        wrongBitDepthFile = new File([await (await fetch(PATH_TO_WRONG_BIT_DEPTH_IMAGE)).blob()], '4bit-image.BMP', { type: 'image/bmp' });
        wrongBitDepthImage = new Image();
        wrongBitDepthImage.src = URL.createObjectURL(wrongBitDepthFile);

        validFile = new File([await (await fetch(PATH_TO_VALID_IMAGE)).blob()], 'valid-image.BMP', { type: 'image/bmp' });
        validImage = new Image();
        validImage.src = URL.createObjectURL(validFile);

        wrongResFile = new File([await (await fetch(PATH_TO_WRONG_RES_IMAGE)).blob()], 'wrongRes-image.BMP', { type: 'image/bmp' });
        wrongResImage = new Image();
        wrongResImage.src = URL.createObjectURL(wrongResFile);
    });

    beforeEach(() => {
        validateResSpy = spyOn(service, 'validateResolution').and.callThrough();
        validateBitDepthSpy = spyOn(service, 'validateBitDepth').and.callThrough();
        generateImageSpy = spyOn(service, 'generateImage').and.callThrough();
    });

    describe('validateImage', () => {
        it('should call generateImage', async () => {
            generateImageSpy.and.returnValue(validImage);
            await service.validateImage(validFile);
            expect(generateImageSpy).toHaveBeenCalled();
        });

        it('should call validateBitDepth & validateResolution', async () => {
            validateResSpy.and.returnValue(true);
            validateBitDepthSpy.and.returnValue(true);
            generateImageSpy.and.returnValue(validImage);
            await service.validateImage(validFile);
            expect(validateResSpy).toHaveBeenCalled();
            expect(validateBitDepthSpy).toHaveBeenCalled();
            expect(generateImageSpy).toHaveBeenCalled();
        });

        it('should refuse empty HTMLInputElement', async () => {
            generateImageSpy.and.returnValue(Promise.resolve(validImage));
            const emptyInput = document.createElement('input');
            expect(await service.validateImage(emptyInput)).toBeFalse();
        });

        it('should accept HTMLInputElementwith [type=file] valid Input File', async () => {
            const validInput = document.createElement('input');
            const dataTransfer = new DataTransfer();

            validInput.type = 'file';
            dataTransfer.items.add(validFile);
            validInput.files = dataTransfer.files;

            generateImageSpy.and.returnValue(document.createElement('img'));
            validateResSpy.and.returnValue(true);
            validateBitDepthSpy.and.returnValue(true);
            expect(await service.validateImage(validInput)).toBeTrue();
        });
    });

    describe('validateResolution', () => {
        it('should refuse images that are not 640x480 resolution', () => {
            expect(service.validateResolution(wrongResImage)).toBeFalse();
        });

        it('should accept images that are 640x480 resolution', () => {
            expect(service.validateResolution(validImage)).toBeTrue();
        });
    });

    describe('validateBitDepth', () => {
        it('should refuse image files that are not 24-bit', async () => {
            generateImageSpy.and.returnValue(Promise.resolve(wrongBitDepthImage));
            expect(await service.validateBitDepth(wrongBitDepthFile)).toBeFalse();

            expect(generateImageSpy).toHaveBeenCalled();
        });

        it('should accept files that are 24-bit', async () => {
            generateImageSpy.and.returnValue(Promise.resolve(validImage));
            expect(await service.validateBitDepth(validFile)).toBeTrue();

            expect(generateImageSpy).toHaveBeenCalled();
        });
    });

    describe('generateImage', () => {
        let inputElement: HTMLInputElement;

        beforeEach(() => {
            inputElement = document.createElement('input');
        });

        it('should create an image from a File', async () => {
            spyOn(Image.prototype, 'decode').and.callFake(() => {});
            spyOn(URL, 'createObjectURL').and.callFake(() => '');
            expect(await service.generateImage(validFile)).toBeTruthy();
            expect((await service.generateImage(validFile)) instanceof HTMLImageElement).toBeTruthy();
        }, 20000);

        it('should create an image from an HTMLInputElement of type file', async () => {
            spyOn(Image.prototype, 'decode').and.callFake(() => {});
            spyOn(URL, 'createObjectURL').and.callFake(() => '');
            const dataTransfer = new DataTransfer();

            inputElement.type = 'file';
            dataTransfer.items.add(validFile);
            inputElement.files = dataTransfer.files;

            expect(await service.generateImage(inputElement)).toBeTruthy();
            expect((await service.generateImage(inputElement)) instanceof HTMLImageElement).toBeTruthy();
        }, 20000);

        it('should not create a URL if the HTMLInputElement is is not of type file', async () => {
            inputElement.type = 'text';
            const image = await service.generateImage(inputElement);

            expect(image.src).toBeFalsy();
        });
    });
});
