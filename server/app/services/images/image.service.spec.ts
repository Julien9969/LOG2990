/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, max-lines, max-len, no-restricted-imports */
import * as fs from 'fs';
import * as Jimp from 'jimp';
import { IMAGE_FORMAT } from '../constants/services.const';
import { DifferenceDetectionService } from '../difference-detection/difference-detection.service';

import { ImageService } from './image.service';
import { exCompResult } from './image.service.spec.const';
let imageService: ImageService;
jest.mock('../difference-detection/difference-detection.service');

describe('Image Service tests', () => {
    beforeAll(async () => {
        imageService = new ImageService();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('service should be defined', async () => {
        expect(imageService).toBeDefined();
    });

    it('getAllImages should Read the directory and return a value', () => {
        const spy1 = jest.spyOn(fs, 'readdirSync');
        const results = imageService.getAllImageIds();
        expect(results).toBeDefined();
        expect(spy1).toHaveBeenCalled();
    });
    it('getImage should call imageExists', () => {
        const spy1 = jest.spyOn(imageService as any, 'imageExists').mockImplementation(() => {
            return true;
        });
        jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
            return null;
        });

        const result = imageService.getImage(15);

        expect(spy1).toHaveBeenCalled();
        expect(result).toBeDefined();
    });
    it('getImage should call getPath if this imageExists return true', () => {
        const spy = jest.spyOn(imageService, 'getPath');
        jest.spyOn(imageService as any, 'imageExists').mockImplementation(() => {
            return true;
        });
        jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
            return null;
        });
        imageService.getImage(15);
        expect(spy).toHaveBeenCalled();
    });
    it('getImage should Read the correct path', () => {
        jest.spyOn(imageService as any, 'imageExists').mockImplementation(() => {
            return true;
        });
        const spy = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
            return null;
        });
        imageService.getImage(12);
        expect(spy).toHaveBeenCalledWith(imageService.getPath(12));
    });
    it('save should write with the correct path and ID', () => {
        const spy1 = jest.spyOn(imageService as any, 'generateId').mockImplementation(() => {
            return 12;
        });

        const spy2 = jest.spyOn(Jimp.prototype, 'write').mockImplementation(() => {
            return null;
        });
        imageService.saveImage(null);
        expect(spy1).toHaveBeenCalled();
        expect(spy2).toHaveBeenCalledWith(imageService.getPath(12));
    });

    it('deleteImage should call imageExists', () => {
        const spy1 = jest.spyOn(imageService as any, 'imageExists').mockImplementation(() => {
            return true;
        });
        jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {
            return null;
        });

        imageService.deleteImage(12);

        expect(spy1).toHaveBeenCalled();
    });
    it('deleteImage should delete the correct file if the image  exist', () => {
        const spy = jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {
            return null;
        });
        jest.spyOn(imageService as any, 'imageExists').mockImplementation(() => {
            return true;
        });

        imageService.deleteImage(12);
        expect(spy).toHaveBeenCalledWith(imageService.getPath(12));
    });

    it('deleteImage should throw an error if the image doesnt Exist', () => {
        jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {
            return null;
        });
        let e: Error;
        try {
            imageService.deleteImage(12);
        } catch (error) {
            e = error;
        }
        expect(e).toEqual(new Error('Image non existante'));
    });

    it('deleteImage should create new differenceDetectionService, compare the 2 images path and get the results', async () => {
        jest.spyOn(imageService as any, 'imageExists').mockImplementation(() => {
            return true;
        });
        const spy2 = jest.spyOn(DifferenceDetectionService.prototype, 'compareImages').mockImplementation(() => {
            return null;
        });

        try {
            await imageService.compareImages(Buffer.from([]), Buffer.from([]), 9);
        } catch (error) {
            // e = error;
        }
        expect(DifferenceDetectionService).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalled();
    });

    it('if the results are invalid, generateDifferenceImage should not be called', async () => {
        jest.spyOn(imageService as any, 'imageExists').mockImplementation(() => {
            return true;
        });
        jest.spyOn(DifferenceDetectionService.prototype, 'compareImages').mockImplementation(() => {
            return null;
        });
        const spy1 = jest.spyOn(DifferenceDetectionService.prototype, 'generateDifferenceImage').mockImplementation(() => {
            return null;
        });
        jest.spyOn(DifferenceDetectionService.prototype, 'getComparisonResult').mockImplementation(() => {
            return exCompResult;
        });

        // let e: HttpException;
        try {
            await imageService.compareImages(Buffer.from([]), Buffer.from([]), 9);
        } catch (error) {
            // e = error;
        }
        expect(spy1).not.toHaveBeenCalled();
    });

    it('if the results are valid, generateDifferenceImage should  be called and diffWrite should be called', async () => {
        jest.spyOn(imageService as any, 'imageExists').mockImplementation(() => {
            return true;
        });
        jest.spyOn(DifferenceDetectionService.prototype, 'compareImages').mockImplementation(() => {
            return null;
        });
        const spy1 = jest.spyOn(DifferenceDetectionService.prototype, 'generateDifferenceImage').mockImplementation(() => {
            return null;
        });
        jest.spyOn(DifferenceDetectionService.prototype, 'getComparisonResult').mockImplementation(() => {
            const result = exCompResult;
            result.isValid = true;
            return result;
        });
        jest.spyOn(imageService as any, 'generateId').mockImplementation(() => {
            return 12;
        });

        try {
            await imageService.compareImages(Buffer.from([]), Buffer.from([]), 9);
        } catch (error) {
            // e = error;
        }
        expect(spy1).toHaveBeenCalled();
    });

    it('getPATH should return the correct path', () => {
        expect(imageService.getPath(12)).toEqual(`assets/game-images/12.${IMAGE_FORMAT}`);
    });
    it('imageExists should return true if the image is in the list of all images', () => {
        jest.spyOn(imageService, 'getAllImageIds').mockImplementation(() => {
            return [12];
        });
        expect(imageService['imageExists'](12)).toBeTruthy();
    });
    it('imageExists should return false if the image is not the list of all images', () => {
        jest.spyOn(imageService, 'getAllImageIds').mockImplementation(() => {
            return [13];
        });
        expect(imageService['imageExists'](12)).toBeFalsy();
    });

    it('generateID should return a valid number', () => {
        const generatedId = imageService['generateId']();
        expect(generatedId).toBeDefined();
        expect(generatedId).toBeGreaterThanOrEqual(0);
    });

    it('imageToBase64 resolves to getBase64 of Jimp image', async () => {
        const base64Str = 'base64';
        const img = new Jimp(10, 10);
        const jimpBase64Spy = jest.spyOn(Jimp.prototype, 'getBase64').mockImplementation((_, cb) => {
            (cb as any)(undefined, base64Str);
            return img;
        });
        const result = await imageService['imageToBase64'](img);

        expect(jimpBase64Spy).toBeCalled();
        expect(result).toEqual(base64Str);
    });

    it('imageToBase64 rejects when Jimp base64 fails', async () => {
        const img = new Jimp(10, 10);
        const error = { message: '' };
        jest.spyOn(Jimp.prototype, 'getBase64').mockImplementation((_, cb) => {
            (cb as any)(error, '');
            return img;
        });

        expect(async () => {
            await imageService['imageToBase64'](img);
        }).rejects.toEqual(error);
    });
});
