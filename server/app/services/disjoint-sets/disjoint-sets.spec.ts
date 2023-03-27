/* eslint-disable @typescript-eslint/no-magic-numbers */
/**
 * Structure de donnée d'ensembles disjoints, inspirée du code de Andrii Heonia, 2014
 * https://github.com/AndriiHeonia/disjoint-set
 */

import { DisjointSet } from './disjoint-sets';
import { commonStub1, commonStub2, commonStub3, commonStub4, commonStub5, commonStub6, set as commonTestSet } from './disjoint-sets.spec.const';

describe('DisjointSet tests', () => {
    beforeAll(() => {
        commonTestSet.add(commonStub1).add(commonStub2).add(commonStub3).add(commonStub4).add(commonStub5).add(commonStub6);
        commonTestSet.union(commonStub1, commonStub2);
        commonTestSet.union(commonStub3, commonStub4);
        commonTestSet.union(commonStub2, commonStub3);
        commonTestSet.union(commonStub5, commonStub6);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    describe('add method', () => {
        it('returns this reference for chaining', () => {
            const testSet = new DisjointSet();
            expect(testSet.add(commonStub1)).toEqual(testSet);
        });
    });

    describe('find method', () => {
        it('does not return undefined', () => {
            const testSet = new DisjointSet();
            const testStub1 = {
                x: 0,
                y: 0,
            };
            expect(testSet.add(testStub1).find(testStub1)).toBeDefined();
        });

        it('returns same set Id when elements are directly connected', () => {
            expect(commonTestSet.find(commonStub1)).toEqual(commonTestSet.find(commonStub2));
        });

        it('returns same set Id when elements are indirectly connected', () => {
            expect(commonTestSet.find(commonStub1)).toEqual(commonTestSet.find(commonStub4));
        });

        it('does not return same set Id same set Id when elements are not in the same set', () => {
            expect(commonTestSet.find(commonStub4)).not.toEqual(commonTestSet.find(commonStub5));
        });
    });

    describe('connected method', () => {
        it('returns true when elements are directly connected', () => {
            expect(commonTestSet.connected(commonStub1, commonStub2)).toBeTruthy();
        });

        it('returns true when elements are indirectly connected', () => {
            expect(commonTestSet.connected(commonStub1, commonStub4)).toBeTruthy();
        });

        it('returns false when elements are not in same set', () => {
            expect(commonTestSet.connected(commonStub4, commonStub5)).toBeFalsy();
        });
    });

    describe('union method', () => {
        it('returns this reference for chaining', () => {
            const testSet = new DisjointSet();
            const testStub1 = {
                x: 0,
                y: 0,
            };
            const testStub2 = {
                x: 0,
                y: 0,
            };
            expect(testSet.union(testStub1, testStub2)).toStrictEqual(testSet);
        });

        it('should correctly merge sets of different sizes', () => {
            const testSet = new DisjointSet();
            const stubSize1 = 1;
            const stubSize2 = 5;

            const testStub1 = {
                x: 0,
                y: 0,
            };
            const testStub2 = {
                x: 0,
                y: 0,
            };

            testSet.add(testStub1);
            testSet.add(testStub2);
            testSet['size'][0] = stubSize1;
            testSet['size'][1] = stubSize2;

            testSet.union(testStub1, testStub2);

            expect(testSet['size'][0]).toEqual(stubSize1 + stubSize2);
            expect(testSet['size'][1]).toEqual(stubSize2);
        });
    });

    describe('getSetLists method', () => {
        const elemCompareToRef = (elem, reference) => {
            return elem.x === reference.x && elem.y === reference.y;
        };

        it('returns elements in arrays by set', () => {
            const getSetListsedList = commonTestSet.getSetLists();

            expect(getSetListsedList[0].find((elem) => elemCompareToRef(elem, commonStub1))).toBeTruthy();
            expect(getSetListsedList[0].find((elem) => elemCompareToRef(elem, commonStub2))).toBeTruthy();
            expect(getSetListsedList[0].find((elem) => elemCompareToRef(elem, commonStub3))).toBeTruthy();
            expect(getSetListsedList[0].find((elem) => elemCompareToRef(elem, commonStub4))).toBeTruthy();
            expect(getSetListsedList[0].find((elem) => elemCompareToRef(elem, commonStub5))).toBeFalsy();
            expect(getSetListsedList[0].find((elem) => elemCompareToRef(elem, commonStub6))).toBeFalsy();

            expect(getSetListsedList[1].find((elem) => elemCompareToRef(elem, commonStub1))).toBeFalsy();
            expect(getSetListsedList[1].find((elem) => elemCompareToRef(elem, commonStub2))).toBeFalsy();
            expect(getSetListsedList[1].find((elem) => elemCompareToRef(elem, commonStub3))).toBeFalsy();
            expect(getSetListsedList[1].find((elem) => elemCompareToRef(elem, commonStub4))).toBeFalsy();
            expect(getSetListsedList[1].find((elem) => elemCompareToRef(elem, commonStub5))).toBeTruthy();
            expect(getSetListsedList[1].find((elem) => elemCompareToRef(elem, commonStub6))).toBeTruthy();
        });

        it('creates a single list when all sets connected', () => {
            commonTestSet.union(commonStub6, commonStub1);
            const getSetListsedList = commonTestSet.getSetLists();

            expect(getSetListsedList.length).toEqual(1);

            expect(getSetListsedList[0].find((elem) => elemCompareToRef(elem, commonStub1))).toBeTruthy();
            expect(getSetListsedList[0].find((elem) => elemCompareToRef(elem, commonStub2))).toBeTruthy();
            expect(getSetListsedList[0].find((elem) => elemCompareToRef(elem, commonStub3))).toBeTruthy();
            expect(getSetListsedList[0].find((elem) => elemCompareToRef(elem, commonStub4))).toBeTruthy();
            expect(getSetListsedList[0].find((elem) => elemCompareToRef(elem, commonStub5))).toBeTruthy();
            expect(getSetListsedList[0].find((elem) => elemCompareToRef(elem, commonStub6))).toBeTruthy();
        });
    });
});
