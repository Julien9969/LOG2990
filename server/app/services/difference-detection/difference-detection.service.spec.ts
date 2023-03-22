/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, max-lines  */

import { BLACK_RGBA, GAME_MAX_DIFF_COUNT, GAME_MIN_DIFF_COUNT, IMAGE_HEIGHT, IMAGE_WIDTH, WHITE_RGBA } from '@app/services/constants/services.const';
import { DisjointSet } from '@app/services/disjoint-sets/disjoint-sets';
import { Coordinate } from '@common/coordinate';
import { ImageComparisonResult } from '@common/image-comparison-result';
import * as fs from 'fs';
import * as Jimp from 'jimp';
import { DifferenceDetectionService } from './difference-detection.service';
import {
    TEST_12_DIFF_IMAGE,
    TEST_2_DIFF_IMAGE,
    TEST_3_DIFF_WITH_RADIUS_IMAGE,
    TEST_7_DIFF_IMAGE, TEST_ALL_RELATIVE_NEIGHBOURS, TEST_EMPTY_IMAGE, TEST_GAME_ID, TEST_PIXEL, TEST_RADIUS_3_EXTENSION
} from './difference-detection.service.spec.const';

/**
 * Constants for tests
 */
let service: DifferenceDetectionService;
let testMainImage: Jimp;
let testAltImage: Jimp;

describe('DifferenceDetection algorithms', () => {
    /**
     * Cette suite de tests roules les algorithmes de détection de différence,
     * et test des propriétés concrètes comme le nombre de différence avec plusieurs images test.
     */

    beforeAll(async () => {
        service = new DifferenceDetectionService();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('service should be defined', async () => {
        expect(service).toBeDefined();
    });

    it('Image comparison properly counts 7 difference and produces valid game', async () => {
        const emptyImage = await Jimp.read(TEST_EMPTY_IMAGE);
        const validAltImage7Diff = await Jimp.read(TEST_7_DIFF_IMAGE);

        jest.spyOn(DifferenceDetectionService.prototype as any, 'loadImages').mockImplementation(() => {});
        service.mainImage = emptyImage;
        service.altImage = validAltImage7Diff;

        service.compareImages(emptyImage.bitmap.data, validAltImage7Diff.bitmap.data);
        expect(service.getDifferenceCount()).toEqual(7);
        expect(service.isValidGame()).toBeTruthy();
    });

    it('Image comparison detects invalid games', async () => {
        const emptyImage = await Jimp.read(TEST_EMPTY_IMAGE);
        const invalidAltImage2Diff = await Jimp.read(TEST_2_DIFF_IMAGE);
        const invalidAltImage12Diff = await Jimp.read(TEST_12_DIFF_IMAGE);

        jest.spyOn(DifferenceDetectionService.prototype as any, 'loadImages').mockImplementation(() => {});
        service.mainImage = emptyImage;

        service.altImage = invalidAltImage2Diff;
        service.compareImages(emptyImage.bitmap.data, invalidAltImage2Diff.bitmap.data);
        expect(service.getDifferenceCount()).toEqual(2);
        expect(service.isValidGame()).toBeFalsy();

        service.altImage = invalidAltImage12Diff;
        service.compareImages(emptyImage.bitmap.data, invalidAltImage12Diff.bitmap.data);
        expect(service.getDifferenceCount()).toEqual(12);
        expect(service.isValidGame()).toBeFalsy();
    });

    it('Larger radius extension merges nearby differences', async () => {
        const emptyImage = await Jimp.read(TEST_EMPTY_IMAGE);
        const radius3Image = await Jimp.read(TEST_3_DIFF_WITH_RADIUS_IMAGE);
        service.mainImage = emptyImage;
        service.altImage = radius3Image;

        jest.spyOn(DifferenceDetectionService.prototype as any, 'loadImages').mockImplementation(() => {});

        service.compareImages(emptyImage.bitmap.data, radius3Image.bitmap.data, 0);
        expect(service.getDifferenceCount()).toEqual(4);

        const radius = 3;
        service.compareImages(emptyImage.bitmap.data, radius3Image.bitmap.data, radius);
        expect(service.getDifferenceCount()).toEqual(3);
    });

    // it('computeRawDiffs correctly computes difference percentage', async () => {
    //     service.mainImage = await Jimp.read(TEST_EMPTY_IMAGE);
    //     service.altImage = await Jimp.read(TEST_EMPTY_IMAGE);
    //     service['computeRawDifferences']();
    //     expect(service.diffProportion).toEqual(0);

    //     service.mainImage = await Jimp.read(TEST_EMPTY_IMAGE);
    //     service.altImage = await Jimp.read(TEST_25_PERCENT_IMAGE);
    //     service['computeRawDifferences']();
    //     expect(service.diffProportion).toEqual(0.25);

    //     service.mainImage = await Jimp.read(TEST_EMPTY_IMAGE);
    //     service.altImage = await Jimp.read(TEST_50_PERCENT_IMAGE);
    //     service['computeRawDifferences']();
    //     expect(service.diffProportion).toEqual(0.5);
    // });

    it('extendRawDifferences calls getExtensionNeighbours for each raw difference', async () => {
        const testImage = await Jimp.read(TEST_2_DIFF_IMAGE);
        const rawDiffImg = testImage.greyscale().contrast(1);
        const numberOfDiffs = 8;

        const getExtensionNeighboursSpy = jest
            .spyOn(DifferenceDetectionService.prototype as any, 'getExtensionNeighbours')
            .mockImplementation(() => [{ x: 0, y: 0 }]);

        service.rawDiffImage = rawDiffImg;
        service['extendRawDifferences']();
        expect(getExtensionNeighboursSpy).toBeCalledTimes(numberOfDiffs);
    });

    it('generateDifferenceImage generates image with the proper number of pixels', () => {
        const testDifferenceList = [
            [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 0, y: 1 },
            ],
            [
                { x: 10, y: 9 },
                { x: 10, y: 10 },
            ],
        ];
        const numberOfPixels = 5;

        jest.spyOn(service.contiguousDifferencesSet, 'getSetLists').mockImplementation(() => {
            return testDifferenceList;
        });

        const setPixelSpy = jest.spyOn(Jimp.prototype as any, 'setPixelColor').mockImplementation(() => {});

        service.generateDifferenceImage();

        expect(setPixelSpy).toBeCalledTimes(numberOfPixels);
    });
});

describe('DifferenceDetection setup and saving', () => {
    beforeAll(async () => {
        service = new DifferenceDetectionService();

        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('compareImages initializes service then calls all the steps for comparison', () => {
        const radius = 9;
        const differenceInitializationSpy = jest
            .spyOn(DifferenceDetectionService.prototype as any, 'differenceInitialization')
            .mockImplementation(() => {});
        const loadImagesSpy = jest.spyOn(DifferenceDetectionService.prototype as any, 'loadImages').mockImplementation(() => {});
        const computeRawDifferencesSpy = jest
            .spyOn(DifferenceDetectionService.prototype as any, 'computeRawDifferences')
            .mockImplementation(() => {});
        const extendRawDifferencesSpy = jest.spyOn(DifferenceDetectionService.prototype as any, 'extendRawDifferences').mockImplementation(() => {});
        const computeContiguousDifferencesSpy = jest
            .spyOn(DifferenceDetectionService.prototype as any, 'computeContiguousDifferences')
            .mockImplementation(() => {});
        const setDifficultySpy = jest.spyOn(service, 'setDifficulty').mockImplementation(() => {});

        service.compareImages(Buffer.from([]), Buffer.from([]), radius);

        expect(differenceInitializationSpy).toBeCalledTimes(1);
        expect(differenceInitializationSpy).toBeCalledWith(radius);
        expect(loadImagesSpy).toBeCalledTimes(1);
        expect(computeRawDifferencesSpy).toBeCalledTimes(1);
        expect(extendRawDifferencesSpy).toBeCalledTimes(1);
        expect(computeContiguousDifferencesSpy).toBeCalledTimes(1);
        expect(setDifficultySpy).toBeCalledTimes(1);
    });

    it('loadImages sets the appropriate attribute', async () => {
        service.mainImage = undefined;
        service.altImage = undefined;

        testMainImage = new Jimp(IMAGE_WIDTH, IMAGE_HEIGHT);
        testAltImage = new Jimp(IMAGE_WIDTH, IMAGE_HEIGHT);
        service['loadImages'](testMainImage, testAltImage);

        expect(service.mainImage).toEqual(testMainImage);
        expect(service.altImage).toEqual(testAltImage);
    });

    it('loadImages throws an error when images of invalid size', () => {
        service.mainImage = undefined;
        service.altImage = undefined;

        expect(() => {
            service['loadImages'](new Jimp(10, 10), new Jimp(10, 10));
        }).toThrow();
    });

    it('getDifferenceCount returns the number of differences', () => {
        const differenceList = [
            [
                { x: 0, y: 0 },
                { x: 0, y: 0 },
                { x: 0, y: 0 },
                { x: 0, y: 0 },
            ],
        ];
        service.contiguousDifferencesSet = new DisjointSet();
        jest.spyOn(service.contiguousDifferencesSet, 'getSetLists').mockImplementation(() => {
            return differenceList;
        });

        const count = service['getDifferenceCount']();
        expect(count).toEqual(differenceList.length);
    });

    it('setDifficulty sets difficult to true when number and proportion respect conditions', () => {
        const getDiffCountSpy = jest.spyOn(service, 'getDifferenceCount').mockImplementation(() => {
            return 7;
        });
        service.diffProportion = 0.15;
        service.setDifficulty();
        expect(service.isDifficult).toBeTruthy();

        getDiffCountSpy.mockImplementation(() => {
            return 9;
        });
        service.diffProportion = 0.1;
        service.setDifficulty();
        expect(service.isDifficult).toBeTruthy();
    });

    it('isDifficultGame returns the right attribute', () => {
        service.isDifficult = true;
        expect(service['isDifficultGame']()).toBeTruthy();
        service.isDifficult = false;
        expect(service['isDifficultGame']()).toBeFalsy();
    });

    it('isValidGame returns true when the number of differences is in authorized range', () => {
        const getDiffCountSpy = jest.spyOn(service, 'getDifferenceCount').mockImplementation(() => 6);
        expect(service['isValidGame']()).toBeTruthy();
        getDiffCountSpy.mockImplementation(() => GAME_MIN_DIFF_COUNT);
        expect(service['isValidGame']()).toBeTruthy();
        getDiffCountSpy.mockImplementation(() => GAME_MAX_DIFF_COUNT);
        expect(service['isValidGame']()).toBeTruthy();
    });

    it('isValidGame returns false when the number of differences is not in authorized range', () => {
        const getDiffCountSpy = jest.spyOn(service, 'getDifferenceCount').mockImplementation(() => GAME_MIN_DIFF_COUNT - 1);
        expect(service['isValidGame']()).toBeFalsy();
        getDiffCountSpy.mockImplementation(() => GAME_MAX_DIFF_COUNT + 1);
        expect(service['isValidGame']()).toBeFalsy();
        getDiffCountSpy.mockImplementation(() => 0);
        expect(service['isValidGame']()).toBeFalsy();
    });

    it('getComparisonResult returns proper attributes', () => {
        const valid = true;
        const hard = false;
        const diffCount = 5;

        const expectedResult: ImageComparisonResult = {
            isValid: valid,
            isHard: hard,
            differenceCount: diffCount,
        };

        jest.spyOn(service, 'isValidGame').mockImplementation(() => valid);
        jest.spyOn(service, 'getDifferenceCount').mockImplementation(() => diffCount);
        jest.spyOn(service, 'isDifficultGame').mockImplementation(() => hard);

        const result = service.getComparisonResult();
        expect(result).toEqual(expectedResult);
    });

    it('differenceInitialization throws an error when the radius is invalid', () => {
        expect(() => {
            service['differenceInitialization'](-1);
        }).toThrow();
        expect(() => {
            service['differenceInitialization'](1);
        }).toThrow();
        expect(() => {
            service['differenceInitialization'](42);
        }).toThrow();
    });

    it('differenceInitialization populates class attributes for image comparison', () => {
        const radius = 3;
        service.radius = undefined;
        service.extendedDiffs = undefined;
        service.extensionCoordinates = undefined;
        service.contiguousDifferencesSet = undefined;

        jest.spyOn(DifferenceDetectionService.prototype as any, 'computeRadiusExtension').mockImplementation(() => {
            return [];
        });
        jest.spyOn(DifferenceDetectionService.prototype as any, 'emptyImageArray').mockImplementation(() => {
            return [];
        });

        service['differenceInitialization'](radius);

        expect(service.radius).toBeDefined();
        expect(service.extendedDiffs).toBeDefined();
        expect(service.extensionCoordinates).toBeDefined();
        expect(service.contiguousDifferencesSet).toBeDefined();
    });

    it('SaveDifferenceLists attempts to generate and save the difference lists', () => {
        const diffList: Coordinate[][] = [[{ x: 0, y: 0 }]];
        service.contiguousDifferencesSet = new DisjointSet();
        const getSetListsDifferenceListsSpy = jest.spyOn(service.contiguousDifferencesSet, 'getSetLists').mockImplementation(() => {
            return diffList;
        });
        const fsWriteFileSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

        service['saveDifferenceLists'](TEST_GAME_ID);

        expect(getSetListsDifferenceListsSpy).toHaveBeenCalled();
        expect(fsWriteFileSpy).toHaveBeenCalled();
    });

    // it('SaveDifferenceLists throws an error when writeFile fails', () => {
    //     jest.spyOn(fs, 'writeFileSync').mockImplementation(async () => {
    //         return new Promise((resolve, reject) => {
    //             reject();
    //         });
    //     });

    //     expect(async () => {
    //         await service.compareImagePaths('', '');
    //     }).rejects.toThrow();
    // });
});

describe('DifferenceDetection utility functions', () => {
    beforeAll(async () => {
        service = new DifferenceDetectionService();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('getExtensionNeighbours returns an empty array when radius of 0', () => {
        service.radius = 0;
        const neighbours = service['getExtensionNeighbours'](TEST_PIXEL);
        expect(neighbours.length).toEqual(0);
        expect(neighbours).toEqual([]);
    });

    it('getExtensionNeighbours returns all direct neighbours when radius of 1', () => {
        service.radius = 1;
        service['extensionCoordinates'] = service.directNeighboursCoordinates;
        const neighbours = service['getExtensionNeighbours'](TEST_PIXEL);
        expect(neighbours.length).toEqual(TEST_ALL_RELATIVE_NEIGHBOURS.length);
        expect(neighbours).toEqual(TEST_ALL_RELATIVE_NEIGHBOURS);
    });

    it('getExtensionNeighbours with radius 3 only returns pixels with positive coordinates', () => {
        service.radius = 3;
        service['extensionCoordinates'] = TEST_RADIUS_3_EXTENSION;
        const neighbours = service['getExtensionNeighbours']({ x: 0, y: 0 });
        expect(neighbours.length).toEqual(14);
        expect(neighbours).toEqual([
            { x: 1, y: 0 },
            { x: 2, y: 0 },
            { x: 3, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
            { x: 2, y: 1 },
            { x: 3, y: 1 },
            { x: 0, y: 2 },
            { x: 1, y: 2 },
            { x: 2, y: 2 },
            { x: 3, y: 2 },
            { x: 0, y: 3 },
            { x: 1, y: 3 },
            { x: 2, y: 3 },
        ]);
    });

    it('getNeighbours returns all direct neighbours if radius of 1', () => {
        service.radius = 1;
        const neighbours = service['getNeighbours'](TEST_PIXEL, service.directNeighboursCoordinates);
        expect(neighbours.length).toEqual(TEST_ALL_RELATIVE_NEIGHBOURS.length);
        expect(neighbours).toEqual(TEST_ALL_RELATIVE_NEIGHBOURS);
    });

    it("getExtensionNeighbours with radius 3 only returns pixels in the picture's bounds", () => {
        service.radius = 3;
        service['extensionCoordinates'] = TEST_RADIUS_3_EXTENSION;
        const neighbours = service['getExtensionNeighbours']({ x: IMAGE_WIDTH - 1, y: IMAGE_HEIGHT - 1 });
        expect(neighbours.length).toEqual(14);
        expect(neighbours).toEqual([
            { x: IMAGE_WIDTH - 3, y: IMAGE_HEIGHT - 4 },
            { x: IMAGE_WIDTH - 2, y: IMAGE_HEIGHT - 4 },
            { x: IMAGE_WIDTH - 1, y: IMAGE_HEIGHT - 4 },
            { x: IMAGE_WIDTH - 4, y: IMAGE_HEIGHT - 3 },
            { x: IMAGE_WIDTH - 3, y: IMAGE_HEIGHT - 3 },
            { x: IMAGE_WIDTH - 2, y: IMAGE_HEIGHT - 3 },
            { x: IMAGE_WIDTH - 1, y: IMAGE_HEIGHT - 3 },
            { x: IMAGE_WIDTH - 4, y: IMAGE_HEIGHT - 2 },
            { x: IMAGE_WIDTH - 3, y: IMAGE_HEIGHT - 2 },
            { x: IMAGE_WIDTH - 2, y: IMAGE_HEIGHT - 2 },
            { x: IMAGE_WIDTH - 1, y: IMAGE_HEIGHT - 2 },
            { x: IMAGE_WIDTH - 4, y: IMAGE_HEIGHT - 1 },
            { x: IMAGE_WIDTH - 3, y: IMAGE_HEIGHT - 1 },
            { x: IMAGE_WIDTH - 2, y: IMAGE_HEIGHT - 1 },
        ]);
    });

    it('getDirectNeighbours returns all direct neighbours with a 1 radius', () => {
        const neighbours = service['getDirectNeighbours'](TEST_PIXEL);
        expect(neighbours.length).toEqual(TEST_ALL_RELATIVE_NEIGHBOURS.length);
        expect(neighbours).toEqual(TEST_ALL_RELATIVE_NEIGHBOURS);
    });

    it('getDirectNeighbours only returns pixels with positive coordinates', () => {
        const neighbours = service['getDirectNeighbours']({ x: 0, y: 0 });
        expect(neighbours.length).toEqual(3);
        expect(neighbours).toEqual([
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
        ]);
    });

    it('isDifferent returns true on a black pixel of the difference image', () => {
        service.rawDiffImage = new Jimp(IMAGE_WIDTH, IMAGE_HEIGHT);
        jest.spyOn(service.rawDiffImage, 'getPixelColour').mockImplementation(() => BLACK_RGBA);
        const result: boolean = service['isDifferent'](TEST_PIXEL);
        expect(result).toBeTruthy();
    });

    it('isDifferent returns false on a white pixel of the difference image', () => {
        service.rawDiffImage = new Jimp(IMAGE_WIDTH, IMAGE_HEIGHT);
        jest.spyOn(service.rawDiffImage, 'getPixelColour').mockImplementation(() => WHITE_RGBA);
        const result: boolean = service['isDifferent'](TEST_PIXEL);
        expect(result).toBeFalsy();
    });

    it('computeExtensionRadius generates an empty list when radius of 0', () => {
        const radius = 3;
        service['computeRadiusExtension'](radius);
        expect(service.extensionCoordinates).toEqual(TEST_RADIUS_3_EXTENSION);
    });

    it('emptyImageArray creates an array of the image size', () => {
        const matrix = service['emptyImageArray']();
        expect(matrix.length).toEqual(IMAGE_WIDTH);
        matrix.forEach((array) => {
            expect(array.length).toEqual(IMAGE_HEIGHT);
        });
    });
});
