/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, max-lines */

import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@app/services/constants/services.const';
import * as fs from 'fs';
import { DifferenceValidationService } from './difference-validation.service';
import { testDifferenceList } from './difference-validation.service.spec.const';

let service: DifferenceValidationService;

describe('Difference Validation service', () => {
    beforeAll(async () => {
        service = new DifferenceValidationService();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it('service should be defined', async () => {
        expect(service).toBeDefined();
    });

    it('loadDifferences should load differences when file read succesful', () => {
        service.differenceCoordLists = undefined;

        jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
            return JSON.stringify(testDifferenceList);
        });

        service.loadDifferences('test');
        expect(service.differenceCoordLists).toEqual(testDifferenceList);
    });

    it('loadDifferences should throw an error when differences empty', () => {
        jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
            return '[]';
        });

        expect(() => {
            service.loadDifferences('');
        }).toThrow();
    });

    it('loadDifferences should throw an error when game not found', () => {
        jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
            throw new Error();
        });

        expect(() => {
            service.loadDifferences('');
        }).toThrow();
    });

    it('checkDifference should return undefined when a difference is absent', () => {
        service.differenceCoordLists = testDifferenceList;
        const absentPixel = { x: 42, y: 100 };
        expect(service.checkDifference(absentPixel.x, absentPixel.y)).toBeUndefined();
    });

    it('checkDifference should return proper difference number when a pixel is present', () => {
        service.differenceCoordLists = testDifferenceList;

        testDifferenceList[0].forEach((pixel) => {
            expect(service.checkDifference(pixel.x, pixel.y)).toEqual(0);
        });

        testDifferenceList[1].forEach((pixel) => {
            expect(service.checkDifference(pixel.x, pixel.y)).toEqual(1);
        });
    });

    it('checkDifference should throw an error when differences not loaded', () => {
        service.differenceCoordLists = undefined;
        expect(() => {
            service.checkDifference(0, 0);
        }).toThrow();
    });

    it('validateGuess validates coordinates in picture bounds', () => {
        expect(service.validateGuess({ x: 0, y: 0 })).toBeTruthy();
        expect(service.validateGuess({ x: 50, y: 50 })).toBeTruthy();
        expect(service.validateGuess({ x: IMAGE_WIDTH - 1, y: IMAGE_HEIGHT - 1 })).toBeTruthy();
    });

    it('validateGuess invalidates coordinates out of the picture', () => {
        expect(service.validateGuess({ x: -1, y: 0 })).toBeFalsy();
        expect(service.validateGuess({ x: 0, y: -1 })).toBeFalsy();
        expect(service.validateGuess({ x: -5, y: -5 })).toBeFalsy();
    });

    it('validateGuess invalidates negative coordinates', () => {
        expect(service.validateGuess({ x: 0, y: IMAGE_HEIGHT })).toBeFalsy();
        expect(service.validateGuess({ x: IMAGE_WIDTH, y: 100 })).toBeFalsy();
        expect(service.validateGuess({ x: 1000, y: 1000 })).toBeFalsy();
    });

    it('getDifferencePixelList', () => {
        service.differenceCoordLists = testDifferenceList;

        expect(service.getDifferencePixelList(0)).toEqual(testDifferenceList[0]);
        expect(service.getDifferencePixelList(1)).toEqual(testDifferenceList[1]);
        expect(service.getDifferencePixelList(2)).toEqual(testDifferenceList[2]);
    });
});
