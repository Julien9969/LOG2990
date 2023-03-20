/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ImageComparisonResult } from '@common/image-comparison-result';
import * as fs from 'fs';
export const exampleStringId = '12';
export const exampleNumberId = 12;
export const exampleImage = fs.readFileSync('assets/test-images/image_empty.bmp');
export const exampleImageComparisonInput: { radius: string } = {
    radius: '3',
};
export const exampleInvalidOutput: ImageComparisonResult = {
    isValid: false,
    isHard: false,
    differenceCount: 0,
    differenceImageBase64: '',
};
export const exampleValidOutput: ImageComparisonResult = {
    isValid: true,
    isHard: false,
    differenceCount: 0,
    differenceImageBase64: '',
};
export const stubFile: Express.Multer.File = {
    fieldname: '',
    originalname: '',
    encoding: '',
    mimetype: '',
    size: undefined,
    stream: undefined,
    destination: '',
    filename: '',
    path: '',
    buffer: undefined,
};
