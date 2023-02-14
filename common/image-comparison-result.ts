export interface ImageComparisonResult {
    isValid: boolean;
    isHard: boolean;
    differenceCount: number;
    differenceImageId?: number;
}

export const instanceOfImageComparisonResult = (object: object | null): object is ImageComparisonResult => {
    if (object) return 'isValid' in object && 'isHard' in object && 'differenceCount' in object;
    return false;
};
