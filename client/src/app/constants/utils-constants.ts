export const TIME_CONST = {
    secInMs: 1000,
    minInSec: 60,
};

export enum MouseButton {
    Left = 0,
    Middle = 1,
    Right = 2,
    Back = 3,
    Forward = 4,
}

export const CANVAS = {
    width: 640,
    height: 480,
};

export const zoomFactor = 0.9;

export const INPUT_VALIDATION = {
    min: 3,
    max: 12,
};

export const BIT_PER_PIXEL = 4;

export const BLINK_COUNT = 6;

export const BLINK_PERIOD_MS = 250;

export const RGB_RED = { r: 255, g: 0, b: 0, a: 255 };

export const DPI_125 = 1.25;

export const GROUP_SIZE = 4;

// for game-creation-form.component

export const SUCCESS_MESSAGE_DISPLAYED_TIME = 3000;
export const ERROR_MESSAGE_DISPLAYED_TIME = 4000;
export const TIME_BEFORE_REDIRECT = 1000;

export const ASCII_START_LOWERCASE_LETTERS = 97;
export const ASCII_END_LOWERCASE_LETTERS = 122;
export const ASCII_START_UPPERCASE_LETTERS = 65;
export const ASCII_END_UPPERCASE_LETTERS = 90;
export const ASCII_START_NUMBERS = 48;
export const ASCII_END_NUMBERS = 57;
export const ASCII_SPACE = 32;

export const MAX_TITLE_LENGTH = 25;

export const NINE_PIXELS = 9;
export const FIFTEEN_PIXELS = 15;
export const ALLOWED_RADIUS = [0, 3, NINE_PIXELS, FIFTEEN_PIXELS];

export const DEFAULT_RADIUS = 3;

// for validate-image.service

export const IMAGE_WIDTH = 640;
export const IMAGE_HEIGHT = 480;
export const BIT_PER_BYTE = 8;
export const PERMITTED_BITE_SIZE = 24;

// for tests

export const PATH_TO_VALID_IMAGE = '/assets/test-assets/image_empty.bmp';
export const PATH_TO_WRONG_BIT_DEPTH_IMAGE = '/assets/test-assets/image_wrong_bit_depth.bmp';
export const PATH_TO_WRONG_RES_IMAGE = '/assets/test-assets/image_wrong_res.bmp';
export const VALID_IMAGE_ID = 1999;
