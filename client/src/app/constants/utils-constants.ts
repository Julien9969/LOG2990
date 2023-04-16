/* eslint-disable @typescript-eslint/no-magic-numbers -- Fichier de constantes*/
export const ERROR_TIMEOUT = 1000;

export const CONVERT_TO_MINUTES = 60;


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

export const DELAY_BEFORE_BUTTONS_UPDATE = 100;

export const BIT_PER_PIXEL = 4;

export const GAMES_PER_PAGE = 4;

export const BLINK_COUNT = 6;

export const BLINK_PERIOD_MS = 250;

export const CHEAT_PERIOD_MS = 125;

export const RGB_RED = { r: 255, g: 0, b: 0, a: 255 };

export const RGB_GREEN = { r: 0, g: 255, b: 0, a: 255 };

export const DPI_125 = 1.25;

export const GROUP_SIZE = 4;

// for game-creation-form.component

export const MESSAGE_DISPLAYED_TIME = 4000;
export const TIME_BEFORE_REDIRECT = 1000;

export const ASCII_START_LOWERCASE_LETTERS = 97;
export const ASCII_END_LOWERCASE_LETTERS = 122;
export const ASCII_START_UPPERCASE_LETTERS = 65;
export const ASCII_END_UPPERCASE_LETTERS = 90;
export const ASCII_START_NUMBERS = 48;
export const ASCII_END_NUMBERS = 57;
export const ASCII_SPACE = 32;

export const MAX_TITLE_LENGTH = 25;

export const ALLOWED_RADIUS = [0, 3, 9, 15];

export const DEFAULT_RADIUS = 3;

export const DELAY_FOCUS = 100;

// for audio.service
export const VOLUME = 0.5;

// for validate-image.service

export const IMAGE_WIDTH = 640;
export const IMAGE_HEIGHT = 480;
export const BIT_PER_BYTE = 8;
export const PERMITTED_BITE_SIZE = 24;

// for draw.service

export const DEFAULT_TOOL_SIZE = 5;
export const DECIMAL_BASE = 10;

// for upload-image-square.component

export const CANVAS_BIT_DEPTH = 4;
export const UPLOADED_IMAGE_BIT_DEPTH = 3;

// for tests

export const PATH_TO_VALID_IMAGE = '/assets/test-assets/image_empty.bmp';
export const PATH_TO_WRONG_BIT_DEPTH_IMAGE = '/assets/test-assets/image_wrong_bit_depth.bmp';
export const PATH_TO_WRONG_RES_IMAGE = '/assets/test-assets/image_wrong_res.bmp';
export const VALID_IMAGE_ID = 1999;

// for game timer constants

export const MAX_GAME_TIME = 120;
export const MIN_GAME_TIME = 10;

export const MAX_PENALTY_TIME = 15;
export const MIN_PENALTY_TIME = 0;

export const MAX_REWARD_TIME = 30;
export const MIN_REWARD_TIME = 0;
