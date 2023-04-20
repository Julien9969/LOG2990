/* eslint-disable @typescript-eslint/no-magic-numbers */

/**
 * Constantes globales du serveur de jeu
 */
// Images acceptées: BMP 24bits, de taille 640 * 480
export const IMAGE_WIDTH = 640;
export const IMAGE_HEIGHT = 480;

/**
 * Constantes de la classe session
 */

// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const NO_WINNER: null = null;

export const TIME_CONST = {
    secondInMilliseconds: 1000,
    minute: 60,
};

export const ALLOWED_NB_CLUES = 3;

/**
 * Constantes du système de détéction de différences
 */
export const DIFFERENCE_LISTS_FOLDER = 'assets/difference-matrix';
export const DIFFERENCE_LISTS_PREFIX = 'diff-matrix-';
export const DIFFERENCE_IMAGES_FOLDER = 'assets/difference-images';

export const BLACK_RGBA = 0x000000ff;
export const WHITE_RGBA = 0xffffffff;

/**
 * Constantes de validation d'images
 */
export const VALID_RADIUS_LIST: number[] = [0, 3, 9, 15];
export const GAME_MIN_DIFF_COUNT = 3;
export const GAME_MAX_DIFF_COUNT = 9;
export const HARD_GAME_MIN_DIFF_COUNT = 7;
export const HARD_GAME_MAX_DIFF_PROPORTION = 0.15;

/**
 * Constantes de gestion d'image
 */
export const IMAGE_FOLDER_PATH = 'assets/game-images';
export const IMAGE_ID_CAP = 10000;
export const IMAGE_FORMAT = 'bmp';

/**
 * Constantes de gestion de jeu
 */
export const GAME_ID_CAP = 10000;

export const GAME_CONSTS_PATH = 'assets/game-data/game-consts.json';

export const DEFAULT_GAME_LEADERBOARD: [string, number][] = [
    ['Bowser', 150],
    ['Peach', 250],
    ['Mario', 780],
];

/*
 * Constante de gestion de Session;
 */
export const SESSION_ID_CAP = 10000;

/**
 * Constantes de ClueService
 */

export const DIVIDER_FIRST_CLUE = 2;
export const DIVIDER_SECOND_CLUE = 4;

export const CLUE_BORDER_WIDTH = 5;
