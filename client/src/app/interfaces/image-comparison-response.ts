export interface ImgCompareRes {
    isValid: boolean;
    isHard: boolean;
    differenceCount: number;
    differenceImageId: number;
}

export const instanceOfImgCompareRes = (object: object | null): object is ImgCompareRes => {
    if (object) return 'isValid' in object && 'isHard' in object && 'differenceCount' in object;
    return false;
};
