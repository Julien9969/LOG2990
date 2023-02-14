/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Utils } from './utils.service';

describe('Utils service tests', () => {
    describe('convertToInt function', () => {
        it('returns correct value', () => {
            expect(Utils.convertToInt('0')).toEqual(0);
            expect(Utils.convertToInt('-17')).toEqual(-17);
            expect(Utils.convertToInt('42')).toEqual(42);
        });

        it('throws an error when input is empty', () => {
            expect(() => {
                Utils.convertToInt(undefined);
            }).toThrow();
            expect(() => {
                Utils.convertToInt('');
            }).toThrow();
            expect(() => {
                Utils.convertToInt(' ');
            }).toThrow();
        });
        it('throws an error when input is not a number', () => {
            expect(() => {
                Utils.convertToInt('--42');
            }).toThrow();
            expect(() => {
                Utils.convertToInt('forty-two');
            }).toThrow();
        });
    });
});
