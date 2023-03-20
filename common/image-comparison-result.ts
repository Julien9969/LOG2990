export interface ImageComparisonResult {
    isValid: boolean;
    isHard: boolean;
    differenceCount: number;
    differenceImageBase64?: string;
}
