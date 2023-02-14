import { ImgCompareRes, instanceOfImgCompareRes } from './image-comparison-response';

describe('instanceOfImgCompareRes', () => {
    it('should return true if the object is an instance of ImgCompareRes', () => {
        const object: ImgCompareRes = {
            isValid: true,
            isHard: false,
            differenceCount: 0,
            differenceImageId: 0,
        };
        expect(instanceOfImgCompareRes(object)).toBeTrue();
    });

    it('should return false i', () => {
        const nullInput = null;
        expect(instanceOfImgCompareRes(nullInput)).toBeFalse();
    });
});
