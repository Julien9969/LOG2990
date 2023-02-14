/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ImageComparisonInput } from '@common/image-comparison-input';
import { ImageComparisonResult } from '@common/image-comparison-result';
import * as fs from 'fs';
export const exampleStringId = '12';
export const exampleNumberId = 12;
export const exampleImage = fs.readFileSync('assets/test-images/image_empty.bmp');
export const exampleImageComparisonInput: ImageComparisonInput = {
    imageMain: 1,
    imageAlt: 2,
    radius: 3,
};
export const exampleInvalidOutput: ImageComparisonResult = {
    isValid: false,
    isHard: false,
    differenceCount: 0,
    differenceImageId: 1,
};
export const exampleValidOutput: ImageComparisonResult = {
    isValid: true,
    isHard: false,
    differenceCount: 0,
    differenceImageId: 1,
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
